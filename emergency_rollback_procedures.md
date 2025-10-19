# Emergency Rollback Procedures

## 🚨 Immediate Rollback (If Issues Arise)

### **Step 1: Stop New Records**
```sql
-- Disable triggers immediately
DROP TRIGGER IF EXISTS trigger_create_lend_borrow_transaction ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_settle_lend_borrow_loan ON lend_borrow;
DROP TRIGGER IF EXISTS trigger_handle_partial_return ON lend_borrow;
```

### **Step 2: Restore Account Balances**
```sql
-- Recalculate account balances without lend/borrow transactions
UPDATE accounts 
SET calculated_balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'income' THEN amount 
            WHEN type = 'expense' THEN -amount 
            ELSE 0 
        END
    ), 0)
    FROM transactions 
    WHERE account_id = accounts.id 
    AND 'lend_borrow' != ALL(tags)
);
```

### **Step 3: Remove Integration Transactions**
```sql
-- Delete all lend/borrow transactions
DELETE FROM transactions 
WHERE 'lend_borrow' = ANY(tags);
```

### **Step 4: Restore Original Data**
```sql
-- Restore from backup if needed
DELETE FROM lend_borrow;
INSERT INTO lend_borrow SELECT * FROM lend_borrow_backup;
```

## 🔄 Partial Rollback Options

### **Option A: Keep Schema, Disable Triggers**
- Keep new columns
- Disable triggers
- Manual transaction creation

### **Option B: Full Rollback**
- Remove all new columns
- Restore original functionality
- Complete system reset

### **Option C: Hybrid Approach**
- Keep toggle functionality
- Disable automatic transactions
- Manual control for users

## 📞 Support Procedures

### **User Communication**
1. **Immediate**: "We're experiencing issues with lend/borrow integration"
2. **Update**: "Rolling back to previous version"
3. **Resolution**: "Issue resolved, new version available"

### **Data Recovery**
1. **Backup Verification**: Check backup integrity
2. **Selective Recovery**: Restore only affected data
3. **User Notification**: Inform users of data changes

## 🛠️ Monitoring & Alerts

### **Key Metrics to Watch**
- Account balance accuracy
- Transaction creation success rate
- User error reports
- Performance impact

### **Alert Thresholds**
- >5% account balance discrepancies
- >10% transaction creation failures
- >20% user error reports
- >50% performance degradation

## 📋 Rollback Checklist

- [ ] Disable triggers
- [ ] Restore account balances
- [ ] Remove integration transactions
- [ ] Verify data integrity
- [ ] Notify users
- [ ] Monitor system stability
- [ ] Plan re-implementation
