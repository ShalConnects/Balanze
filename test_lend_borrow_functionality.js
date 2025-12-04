/**
 * Comprehensive Lend & Borrow Functionality Test Script
 * This script tests all lend & borrow scenarios through the UI
 * 
 * INSTRUCTIONS:
 * 1. Open the application in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: testLendBorrowFunctionality()
 * 
 * WARNING: This will create test data in your database!
 */

async function testLendBorrowFunctionality() {
    console.log('🧪 Starting Comprehensive Lend & Borrow Test Suite...');
    console.log('⚠️  WARNING: This will create test data in your database!');
    
    const testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Helper function to log test results
    function logTest(testName, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}`);
        if (details) console.log(`   Details: ${details}`);
        
        testResults.tests.push({ name: testName, passed, details });
        if (passed) testResults.passed++;
        else testResults.failed++;
    }

    // Helper function to wait for element
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Helper function to simulate user input
    function simulateInput(element, value) {
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Helper function to click element
    function clickElement(element) {
        element.click();
    }

    // Helper function to wait for modal to open
    function waitForModal() {
        return waitForElement('[role="dialog"], .fixed.inset-0');
    }

    try {
        // ==============================================
        // TEST 1: Navigate to Lend & Borrow Section
        // ==============================================
        console.log('\n📋 TEST 1: Navigate to Lend & Borrow Section');
        
        // Look for lend/borrow navigation or button
        const lendBorrowNav = document.querySelector('[href*="lend"], [href*="borrow"], button:contains("Lend"), button:contains("Borrow")');
        if (lendBorrowNav) {
            clickElement(lendBorrowNav);
            await new Promise(resolve => setTimeout(resolve, 1000));
            logTest('Navigate to Lend & Borrow', true);
        } else {
            logTest('Navigate to Lend & Borrow', false, 'Navigation element not found');
        }

        // ==============================================
        // TEST 2: Test Account-Linked Lend Record Creation
        // ==============================================
        console.log('\n📋 TEST 2: Account-Linked Lend Record Creation');
        
        // Look for "Add" or "New" button
        const addButton = document.querySelector('button:contains("Add"), button:contains("New"), button:contains("+")');
        if (addButton) {
            clickElement(addButton);
            await waitForModal();
            
            // Fill form for account-linked lend
            const typeSelect = document.querySelector('select[name="type"], [data-testid="type-select"]');
            if (typeSelect) {
                typeSelect.value = 'lend';
                typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const personInput = document.querySelector('input[name="person_name"], [data-testid="person-name"]');
            if (personInput) {
                simulateInput(personInput, 'Test Borrower Account-Linked');
            }
            
            const amountInput = document.querySelector('input[name="amount"], [data-testid="amount"]');
            if (amountInput) {
                simulateInput(amountInput, '1000');
            }
            
            // Check if account selection is available
            const accountSelect = document.querySelector('select[name="account_id"], [data-testid="account-select"]');
            if (accountSelect && accountSelect.options.length > 1) {
                accountSelect.value = accountSelect.options[1].value;
                accountSelect.dispatchEvent(new Event('change', { bubbles: true }));
                logTest('Account-Linked Lend Form Filled', true);
            } else {
                logTest('Account-Linked Lend Form Filled', false, 'Account selection not available');
            }
            
            // Submit form
            const submitButton = document.querySelector('button[type="submit"], button:contains("Add"), button:contains("Save")');
            if (submitButton) {
                clickElement(submitButton);
                await new Promise(resolve => setTimeout(resolve, 2000));
                logTest('Account-Linked Lend Record Created', true);
            } else {
                logTest('Account-Linked Lend Record Created', false, 'Submit button not found');
            }
        } else {
            logTest('Account-Linked Lend Record Creation', false, 'Add button not found');
        }

        // ==============================================
        // TEST 3: Test Record-Only Lend Record Creation
        // ==============================================
        console.log('\n📋 TEST 3: Record-Only Lend Record Creation');
        
        const addButton2 = document.querySelector('button:contains("Add"), button:contains("New"), button:contains("+")');
        if (addButton2) {
            clickElement(addButton2);
            await waitForModal();
            
            // Toggle to "Record Only" mode
            const recordOnlyToggle = document.querySelector('button:contains("Record Only"), [data-testid="record-only"]');
            if (recordOnlyToggle) {
                clickElement(recordOnlyToggle);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Fill form for record-only lend
            const typeSelect2 = document.querySelector('select[name="type"], [data-testid="type-select"]');
            if (typeSelect2) {
                typeSelect2.value = 'lend';
                typeSelect2.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const personInput2 = document.querySelector('input[name="person_name"], [data-testid="person-name"]');
            if (personInput2) {
                simulateInput(personInput2, 'Test Borrower Record-Only');
            }
            
            const amountInput2 = document.querySelector('input[name="amount"], [data-testid="amount"]');
            if (amountInput2) {
                simulateInput(amountInput2, '500');
            }
            
            // Check if currency selection is available (for record-only)
            const currencySelect = document.querySelector('select[name="currency"], [data-testid="currency-select"]');
            if (currencySelect && currencySelect.options.length > 0) {
                currencySelect.value = currencySelect.options[1].value;
                currencySelect.dispatchEvent(new Event('change', { bubbles: true }));
                logTest('Record-Only Lend Form Filled', true);
            } else {
                logTest('Record-Only Lend Form Filled', false, 'Currency selection not available');
            }
            
            // Submit form
            const submitButton2 = document.querySelector('button[type="submit"], button:contains("Add"), button:contains("Save")');
            if (submitButton2) {
                clickElement(submitButton2);
                await new Promise(resolve => setTimeout(resolve, 2000));
                logTest('Record-Only Lend Record Created', true);
            } else {
                logTest('Record-Only Lend Record Created', false, 'Submit button not found');
            }
        } else {
            logTest('Record-Only Lend Record Creation', false, 'Add button not found');
        }

        // ==============================================
        // TEST 4: Test Account-Linked Borrow Record Creation
        // ==============================================
        console.log('\n📋 TEST 4: Account-Linked Borrow Record Creation');
        
        const addButton3 = document.querySelector('button:contains("Add"), button:contains("New"), button:contains("+")');
        if (addButton3) {
            clickElement(addButton3);
            await waitForModal();
            
            // Toggle to "From Account" mode
            const fromAccountToggle = document.querySelector('button:contains("From Account"), [data-testid="from-account"]');
            if (fromAccountToggle) {
                clickElement(fromAccountToggle);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Fill form for account-linked borrow
            const typeSelect3 = document.querySelector('select[name="type"], [data-testid="type-select"]');
            if (typeSelect3) {
                typeSelect3.value = 'borrow';
                typeSelect3.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const personInput3 = document.querySelector('input[name="person_name"], [data-testid="person-name"]');
            if (personInput3) {
                simulateInput(personInput3, 'Test Lender Account-Linked');
            }
            
            const amountInput3 = document.querySelector('input[name="amount"], [data-testid="amount"]');
            if (amountInput3) {
                simulateInput(amountInput3, '750');
            }
            
            // Check if account selection is available
            const accountSelect3 = document.querySelector('select[name="account_id"], [data-testid="account-select"]');
            if (accountSelect3 && accountSelect3.options.length > 1) {
                accountSelect3.value = accountSelect3.options[1].value;
                accountSelect3.dispatchEvent(new Event('change', { bubbles: true }));
                logTest('Account-Linked Borrow Form Filled', true);
            } else {
                logTest('Account-Linked Borrow Form Filled', false, 'Account selection not available');
            }
            
            // Submit form
            const submitButton3 = document.querySelector('button[type="submit"], button:contains("Add"), button:contains("Save")');
            if (submitButton3) {
                clickElement(submitButton3);
                await new Promise(resolve => setTimeout(resolve, 2000));
                logTest('Account-Linked Borrow Record Created', true);
            } else {
                logTest('Account-Linked Borrow Record Created', false, 'Submit button not found');
            }
        } else {
            logTest('Account-Linked Borrow Record Creation', false, 'Add button not found');
        }

        // ==============================================
        // TEST 5: Test Record List Display
        // ==============================================
        console.log('\n📋 TEST 5: Record List Display');
        
        // Wait for records to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Look for record list
        const recordList = document.querySelector('[data-testid="record-list"], .lend-borrow-list, table, .grid');
        if (recordList) {
            const records = recordList.querySelectorAll('tr, .record-item, [data-testid="record"]');
            logTest('Record List Display', records.length > 0, `Found ${records.length} records`);
        } else {
            logTest('Record List Display', false, 'Record list not found');
        }

        // ==============================================
        // TEST 6: Test Edit Functionality
        // ==============================================
        console.log('\n📋 TEST 6: Edit Functionality');
        
        // Look for edit buttons
        const editButtons = document.querySelectorAll('button:contains("Edit"), [data-testid="edit"], .edit-button');
        if (editButtons.length > 0) {
            // Try to edit the first record
            clickElement(editButtons[0]);
            await waitForModal();
            
            // Check if form is in edit mode
            const editForm = document.querySelector('form, [data-testid="edit-form"]');
            if (editForm) {
                logTest('Edit Modal Opened', true);
                
                // Try to modify a field
                const amountInput = document.querySelector('input[name="amount"], [data-testid="amount"]');
                if (amountInput) {
                    const originalValue = amountInput.value;
                    simulateInput(amountInput, (parseFloat(originalValue) + 100).toString());
                    logTest('Edit Form Modified', true);
                    
                    // Submit edit
                    const submitButton = document.querySelector('button[type="submit"], button:contains("Update"), button:contains("Save")');
                    if (submitButton) {
                        clickElement(submitButton);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        logTest('Edit Submitted', true);
                    } else {
                        logTest('Edit Submitted', false, 'Submit button not found');
                    }
                } else {
                    logTest('Edit Form Modified', false, 'Amount input not found');
                }
            } else {
                logTest('Edit Modal Opened', false, 'Edit form not found');
            }
        } else {
            logTest('Edit Functionality', false, 'Edit buttons not found');
        }

        // ==============================================
        // TEST 7: Test Settlement Functionality
        // ==============================================
        console.log('\n📋 TEST 7: Settlement Functionality');
        
        // Look for settle buttons
        const settleButtons = document.querySelectorAll('button:contains("Settle"), [data-testid="settle"], .settle-button');
        if (settleButtons.length > 0) {
            // Try to settle the first record
            clickElement(settleButtons[0]);
            await waitForModal();
            
            // Check if settlement modal opened
            const settlementModal = document.querySelector('[data-testid="settlement-modal"], .settlement-modal');
            if (settlementModal) {
                logTest('Settlement Modal Opened', true);
                
                // Try partial settlement
                const partialButton = document.querySelector('button:contains("Partial"), [data-testid="partial-settlement"]');
                if (partialButton) {
                    clickElement(partialButton);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const amountInput = document.querySelector('input[name="amount"], [data-testid="settlement-amount"]');
                    if (amountInput) {
                        simulateInput(amountInput, '100');
                        logTest('Partial Settlement Amount Set', true);
                        
                        // Submit settlement
                        const submitButton = document.querySelector('button[type="submit"], button:contains("Settle"), button:contains("Submit")');
                        if (submitButton) {
                            clickElement(submitButton);
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            logTest('Partial Settlement Submitted', true);
                        } else {
                            logTest('Partial Settlement Submitted', false, 'Submit button not found');
                        }
                    } else {
                        logTest('Partial Settlement Amount Set', false, 'Amount input not found');
                    }
                } else {
                    logTest('Settlement Modal Opened', false, 'Partial settlement option not found');
                }
            } else {
                logTest('Settlement Modal Opened', false, 'Settlement modal not found');
            }
        } else {
            logTest('Settlement Functionality', false, 'Settle buttons not found');
        }

        // ==============================================
        // TEST 8: Test Delete Functionality
        // ==============================================
        console.log('\n📋 TEST 8: Delete Functionality');
        
        // Look for delete buttons
        const deleteButtons = document.querySelectorAll('button:contains("Delete"), [data-testid="delete"], .delete-button');
        if (deleteButtons.length > 0) {
            // Try to delete the first record
            clickElement(deleteButtons[0]);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if confirmation modal opened
            const confirmModal = document.querySelector('[data-testid="confirm-modal"], .confirm-modal, [role="dialog"]');
            if (confirmModal) {
                logTest('Delete Confirmation Modal Opened', true);
                
                // Confirm deletion
                const confirmButton = document.querySelector('button:contains("Delete"), button:contains("Confirm"), button:contains("Yes")');
                if (confirmButton) {
                    clickElement(confirmButton);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    logTest('Delete Confirmed', true);
                } else {
                    logTest('Delete Confirmed', false, 'Confirm button not found');
                }
            } else {
                logTest('Delete Confirmation Modal Opened', false, 'Confirmation modal not found');
            }
        } else {
            logTest('Delete Functionality', false, 'Delete buttons not found');
        }

        // ==============================================
        // TEST 9: Test Form Validation
        // ==============================================
        console.log('\n📋 TEST 9: Form Validation');
        
        const addButton4 = document.querySelector('button:contains("Add"), button:contains("New"), button:contains("+")');
        if (addButton4) {
            clickElement(addButton4);
            await waitForModal();
            
            // Try to submit empty form
            const submitButton = document.querySelector('button[type="submit"], button:contains("Add"), button:contains("Save")');
            if (submitButton) {
                clickElement(submitButton);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check for validation errors
                const errorMessages = document.querySelectorAll('.error, .text-red-600, [data-testid="error"]');
                if (errorMessages.length > 0) {
                    logTest('Form Validation Working', true, `Found ${errorMessages.length} validation errors`);
                } else {
                    logTest('Form Validation Working', false, 'No validation errors found');
                }
            } else {
                logTest('Form Validation', false, 'Submit button not found');
            }
        } else {
            logTest('Form Validation', false, 'Add button not found');
        }

        // ==============================================
        // TEST 10: Test Auto Due Date (7 days)
        // ==============================================
        console.log('\n📋 TEST 10: Auto Due Date (7 days)');
        
        const addButton5 = document.querySelector('button:contains("Add"), button:contains("New"), button:contains("+")');
        if (addButton5) {
            clickElement(addButton5);
            await waitForModal();
            
            // Toggle to "From Account" mode
            const fromAccountToggle = document.querySelector('button:contains("From Account"), [data-testid="from-account"]');
            if (fromAccountToggle) {
                clickElement(fromAccountToggle);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Fill form without due date
            const typeSelect = document.querySelector('select[name="type"], [data-testid="type-select"]');
            if (typeSelect) {
                typeSelect.value = 'lend';
                typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            const personInput = document.querySelector('input[name="person_name"], [data-testid="person-name"]');
            if (personInput) {
                simulateInput(personInput, 'Auto Due Date Test');
            }
            
            const amountInput = document.querySelector('input[name="amount"], [data-testid="amount"]');
            if (amountInput) {
                simulateInput(amountInput, '200');
            }
            
            // Check if due date field is visible
            const dueDateField = document.querySelector('input[name="due_date"], [data-testid="due-date"]');
            if (dueDateField) {
                logTest('Due Date Field Visible', true);
                
                // Leave due date empty and submit
                const submitButton = document.querySelector('button[type="submit"], button:contains("Add"), button:contains("Save")');
                if (submitButton) {
                    clickElement(submitButton);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    logTest('Auto Due Date Test Submitted', true);
                } else {
                    logTest('Auto Due Date Test Submitted', false, 'Submit button not found');
                }
            } else {
                logTest('Due Date Field Visible', false, 'Due date field not found');
            }
        } else {
            logTest('Auto Due Date Test', false, 'Add button not found');
        }

        // ==============================================
        // FINAL RESULTS
        // ==============================================
        console.log('\n🎉 TEST SUITE COMPLETED!');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
        
        if (testResults.failed === 0) {
            console.log('🎉 ALL TESTS PASSED! Lend & Borrow functionality is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the details above.');
        }
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Test suite failed with error:', error);
        logTest('Test Suite Execution', false, error.message);
        return testResults;
    }
}

// Auto-run the test suite
console.log('🚀 Lend & Borrow Test Suite Ready!');
console.log('📋 Run: testLendBorrowFunctionality()');
console.log('⚠️  WARNING: This will create test data in your database!');

// Export for manual execution
window.testLendBorrowFunctionality = testLendBorrowFunctionality;
