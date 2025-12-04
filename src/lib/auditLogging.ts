import { supabase } from './supabase';

export interface AuditLogData {
  action_type: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const createAuditLog = async (data: AuditLogData): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase
      .rpc('log_audit_event', {
        p_action_type: data.action_type,
        p_entity_type: data.entity_type,
        p_entity_id: data.entity_id,
        p_old_values: data.old_values,
        p_new_values: data.new_values,
        p_metadata: data.metadata,
        p_severity: data.severity || 'low'
      });

    if (error) {

      return null;
    }


    return result;
  } catch (error) {

    return null;
  }
};

export const testAuditLogging = async (): Promise<boolean> => {
  try {
    const result = await createAuditLog({
      action_type: 'test',
      entity_type: 'system',
      metadata: { message: 'Testing audit logging system' },
      severity: 'low'
    });
    
    return result !== null;
  } catch (error) {

    return false;
  }
};

export const logTransactionEvent = async (
  action: 'create' | 'update' | 'delete',
  transactionData: any,
  oldData?: any
): Promise<string | null> => {
  return createAuditLog({
    action_type: action,
    entity_type: 'transaction',
    entity_id: transactionData.id,
    old_values: oldData,
    new_values: transactionData,
    metadata: {
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      account_id: transactionData.account_id
    },
    severity: 'medium'
  });
}; 

