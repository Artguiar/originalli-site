import {createInterface} from 'node:readline/promises';
import {stdin, stdout} from 'node:process';
import {randomBytes} from 'node:crypto';
import {openDatabase} from '../server/database.mjs';
import {passwordHash} from '../portal/worker.mjs';

const DB = await openDatabase();
try {
  if (await DB.prepare('SELECT id FROM life_users LIMIT 1').first()) {
    console.log('Administração já configurada. Nenhum usuário ou senha foi alterado.');
  } else {
    if (!stdin.isTTY) throw new Error('Execute setup em um terminal interativo para criar o primeiro acesso.');
    const terminal = createInterface({input:stdin,output:stdout});
    try {
      const username = (await terminal.question('E-mail do administrador: ')).trim().toLowerCase();
      const name = (await terminal.question('Nome do administrador: ')).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || username.length > 180 || !name || name.length > 150) throw new Error('Informe um nome e e-mail válidos.');
      const password = randomBytes(18).toString('base64url');
      await DB.prepare('INSERT INTO life_users(id,username,name,company_id,role,password,must_change,active) VALUES(?,?,?,?,?,?,1,1)').bind(crypto.randomUUID(),username,name,null,'admin',await passwordHash(password)).run();
      console.log(`\nLogin: ${username}\nSenha temporária: ${password}\nGuarde esta senha. A troca é obrigatória no primeiro acesso em /vida-grupo/.`);
    } finally { terminal.close(); }
  }
} finally { DB.close(); }
