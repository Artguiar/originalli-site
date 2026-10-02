import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const companies=sqliteTable('life_companies',{id:text('id').primaryKey(),name:text('name').notNull(),cnpj:text('cnpj').notNull(),created:text('created').notNull()});
export const users=sqliteTable('life_users',{id:text('id').primaryKey(),username:text('username').notNull().unique(),name:text('name').notNull(),companyId:text('company_id'),role:text('role').notNull(),password:text('password').notNull(),mustChange:integer('must_change').notNull().default(1),active:integer('active').notNull().default(1)});
export const sessions=sqliteTable('life_sessions',{token:text('token').primaryKey(),userId:text('user_id').notNull(),expires:integer('expires').notNull()},t=>[index('life_sessions_user').on(t.userId)]);
export const attempts=sqliteTable('life_attempts',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
export const policies=sqliteTable('life_policies',{id:text('id').primaryKey(),companyId:text('company_id').notNull(),insurer:text('insurer').notNull(),number:text('number'),start:text('start').notNull(),end:text('end'),notes:text('notes').notNull(),summary:text('summary').notNull()},t=>[index('life_policy_company').on(t.companyId)]);
export const files=sqliteTable('life_files',{id:text('id').primaryKey(),policyId:text('policy_id').notNull(),competence:text('competence').notNull(),kind:text('kind').notNull(),name:text('name').notNull(),size:integer('size').notNull(),hash:text('hash').notNull(),objectKey:text('object_key').notNull(),userId:text('user_id').notNull(),created:text('created').notNull(),status:text('status').notNull(),note:text('note').notNull().default(''),rows:text('rows'),parseNote:text('parse_note').notNull().default('')},t=>[index('life_files_policy_month').on(t.policyId,t.competence)]);
export const snapshots=sqliteTable('life_snapshots',{id:text('id').primaryKey(),policyId:text('policy_id').notNull(),competence:text('competence').notNull(),fileId:text('file_id').notNull().unique(),rows:text('rows').notNull(),created:text('created').notNull(),userId:text('user_id').notNull()},t=>[index('life_snapshot_policy_month').on(t.policyId,t.competence)]);
export const audit=sqliteTable('life_audit',{id:text('id').primaryKey(),policyId:text('policy_id'),userId:text('user_id').notNull(),action:text('action').notNull(),detail:text('detail').notNull(),created:text('created').notNull()},t=>[index('life_audit_policy').on(t.policyId,t.created)]);

export const permissions=sqliteTable('life_permissions',{userId:text('user_id').primaryKey(),config:text('config').notNull()});
export const deadlines=sqliteTable('life_deadlines',{policyId:text('policy_id').primaryKey(),rhDay:integer('rh_day').notNull(),technicalDay:integer('technical_day').notNull(),reminderDays:integer('reminder_days').notNull()});
export const transmissions=sqliteTable('life_transmissions',{id:text('id').primaryKey(),policyId:text('policy_id').notNull(),competence:text('competence').notNull(),fileId:text('file_id').notNull(),protocol:text('protocol').notNull(),sentAt:text('sent_at').notNull(),userId:text('user_id').notNull(),created:text('created').notNull()});

export const leads=sqliteTable('site_leads',{
  id:text('id').primaryKey(),requestId:text('request_id').notNull().unique(),payloadHash:text('payload_hash').notNull(),
  name:text('name').notNull(),phone:text('phone').notNull(),profile:text('profile').notNull(),interest:text('interest').notNull(),
  city:text('city').notNull(),page:text('page').notNull(),attribution:text('attribution').notNull(),consentVersion:text('consent_version').notNull(),created:text('created').notNull()
},t=>[index('site_leads_created').on(t.created)]);
export const outbox=sqliteTable('site_outbox',{
  id:text('id').primaryKey(),leadId:text('lead_id').notNull().unique().references(()=>leads.id),
  status:text('status').notNull().default('pending'),attempts:integer('attempts').notNull().default(0),
  nextAttempt:text('next_attempt').notNull(),lockedUntil:text('locked_until'),lastError:text('last_error'),deliveredAt:text('delivered_at')
},t=>[index('site_outbox_pending').on(t.status,t.nextAttempt)]);
export const rateLimits=sqliteTable('site_rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
