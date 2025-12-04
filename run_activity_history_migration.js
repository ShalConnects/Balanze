import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🚀 Starting activity_history migration...');
  
  try {
    // Step 1: Check if user_id column exists
    console.log('📝 Checking if user_id column exists...');
    const { data: columnCheck, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'activity_history' AND column_name = 'user_id';
      `
    });
    
    if (checkError) {
      console.log('Column check failed, trying to add column...');
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE activity_history ADD COLUMN IF NOT EXISTS user_id TEXT;'
      });
      
      if (alterError) {
        console.log('Column might already exist, continuing...');
      }
    } else {
      console.log('✅ user_id column already exists');
    }
    
    // Step 2: Update transaction trigger
    console.log('🔧 Updating transaction trigger...');
    const transactionTriggerSQL = `
      CREATE OR REPLACE FUNCTION log_transaction_activity()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO activity_history (
              activity_type,
              entity_type,
              entity_id,
              description,
              changes,
              user_id
          ) VALUES (
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'TRANSACTION_CREATED'
                  WHEN TG_OP = 'UPDATE' THEN 'TRANSACTION_UPDATED'
                  WHEN TG_OP = 'DELETE' THEN 'TRANSACTION_DELETED'
              END,
              'transaction',
              COALESCE(NEW.id, OLD.id),
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'New transaction created'
                  WHEN TG_OP = 'UPDATE' THEN 'Transaction updated'
                  WHEN TG_OP = 'DELETE' THEN 'Transaction deleted'
              END,
              CASE 
                  WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
                  WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                  WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
              END,
              COALESCE(NEW.user_id, OLD.user_id)
          );
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: transactionTriggerError } = await supabase.rpc('exec_sql', { sql: transactionTriggerSQL });
    if (transactionTriggerError) {
      console.error('❌ Error updating transaction trigger:', transactionTriggerError);
    } else {
      console.log('✅ Transaction trigger updated');
    }
    
    // Step 3: Update purchase trigger
    console.log('🔧 Updating purchase trigger...');
    const purchaseTriggerSQL = `
      CREATE OR REPLACE FUNCTION log_purchase_activity()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO activity_history (
              activity_type,
              entity_type,
              entity_id,
              description,
              changes,
              user_id
          ) VALUES (
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'PURCHASE_CREATED'
                  WHEN TG_OP = 'UPDATE' THEN 'PURCHASE_UPDATED'
                  WHEN TG_OP = 'DELETE' THEN 'PURCHASE_DELETED'
              END,
              'purchase',
              COALESCE(NEW.id, OLD.id),
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'New purchase created'
                  WHEN TG_OP = 'UPDATE' THEN 'Purchase updated'
                  WHEN TG_OP = 'DELETE' THEN 'Purchase deleted'
              END,
              CASE 
                  WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
                  WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                  WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
              END,
              COALESCE(NEW.user_id, OLD.user_id)
          );
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: purchaseTriggerError } = await supabase.rpc('exec_sql', { sql: purchaseTriggerSQL });
    if (purchaseTriggerError) {
      console.error('❌ Error updating purchase trigger:', purchaseTriggerError);
    } else {
      console.log('✅ Purchase trigger updated');
    }
    
    // Step 4: Create account trigger
    console.log('🔧 Creating account trigger...');
    const accountTriggerSQL = `
      CREATE OR REPLACE FUNCTION log_account_activity()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO activity_history (
              activity_type,
              entity_type,
              entity_id,
              description,
              changes,
              user_id
          ) VALUES (
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'ACCOUNT_CREATED'
                  WHEN TG_OP = 'UPDATE' THEN 'ACCOUNT_UPDATED'
                  WHEN TG_OP = 'DELETE' THEN 'ACCOUNT_DELETED'
              END,
              'account',
              COALESCE(NEW.id, OLD.id),
              CASE 
                  WHEN TG_OP = 'INSERT' THEN 'New account created'
                  WHEN TG_OP = 'UPDATE' THEN 'Account updated'
                  WHEN TG_OP = 'DELETE' THEN 'Account deleted'
              END,
              CASE 
                  WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
                  WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                  WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
              END,
              COALESCE(NEW.user_id, OLD.user_id)
          );
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS log_account_activity_trigger ON accounts;
      CREATE TRIGGER log_account_activity_trigger
          AFTER INSERT OR UPDATE OR DELETE ON accounts
          FOR EACH ROW EXECUTE FUNCTION log_account_activity();
    `;
    
    const { error: accountTriggerError } = await supabase.rpc('exec_sql', { sql: accountTriggerSQL });
    if (accountTriggerError) {
      console.error('❌ Error creating account trigger:', accountTriggerError);
    } else {
      console.log('✅ Account trigger created');
    }
    
    // Step 5: Create backfill function
    console.log('🔧 Creating backfill function...');
    const backfillSQL = `
      CREATE OR REPLACE FUNCTION backfill_activity_history_user_id()
      RETURNS void AS $$
      DECLARE
          record RECORD;
      BEGIN
          -- Backfill user_id for transaction records
          FOR record IN 
              SELECT ah.id, t.user_id 
              FROM activity_history ah
              JOIN transactions t ON ah.entity_id = t.id::text
              WHERE ah.entity_type = 'transaction' AND ah.user_id IS NULL
          LOOP
              UPDATE activity_history 
              SET user_id = record.user_id 
              WHERE id = record.id;
          END LOOP;
          
          -- Backfill user_id for purchase records
          FOR record IN 
              SELECT ah.id, p.user_id 
              FROM activity_history ah
              JOIN purchases p ON ah.entity_id = p.id::text
              WHERE ah.entity_type = 'purchase' AND ah.user_id IS NULL
          LOOP
              UPDATE activity_history 
              SET user_id = record.user_id 
              WHERE id = record.id;
          END LOOP;
          
          -- Backfill user_id for account records
          FOR record IN 
              SELECT ah.id, a.user_id 
              FROM activity_history ah
              JOIN accounts a ON ah.entity_id = a.id::text
              WHERE ah.entity_type = 'account' AND ah.user_id IS NULL
          LOOP
              UPDATE activity_history 
              SET user_id = record.user_id 
              WHERE id = record.id;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: backfillError } = await supabase.rpc('exec_sql', { sql: backfillSQL });
    if (backfillError) {
      console.error('❌ Error creating backfill function:', backfillError);
    } else {
      console.log('✅ Backfill function created');
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Step 6: Check existing records
    console.log('\n📊 Checking existing records...');
    const { data: existingRecords, error: countError } = await supabase
      .from('activity_history')
      .select('id, user_id')
      .is('user_id', null);
    
    if (countError) {
      console.error('❌ Error checking existing records:', countError);
      return;
    }
    
    const nullUserRecords = existingRecords?.length || 0;
    console.log(`📈 Found ${nullUserRecords} records with null user_id`);
    
    if (nullUserRecords > 0) {
      console.log('\n🔄 To backfill user_id for existing records, run:');
      console.log('SELECT backfill_activity_history_user_id();');
    }
    
    console.log('\n🎉 Migration complete! New account and transfer events will now be logged.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration(); 