/** Temporary Last Wish test account — remove 1-day option when testing is done. */
export const LAST_WISH_TEST_USER_ID = 'd1fe3ccc-3c57-4621-866a-6d0643137d53';

const LAST_WISH_CHECK_IN_FREQUENCIES = [
  { value: 7, label: '7', unit: 'days' },
  { value: 14, label: '14', unit: 'days' },
  { value: 30, label: '30', unit: 'days' },
  { value: 60, label: '60', unit: 'days' },
  { value: 90, label: '90', unit: 'days' },
];

/** @param {string | undefined | null} userId */
export function lastWishCheckInFrequencyOptions(userId) {
  if (userId === LAST_WISH_TEST_USER_ID) {
    return [{ value: 1, label: '1', unit: 'days' }, ...LAST_WISH_CHECK_IN_FREQUENCIES];
  }
  return LAST_WISH_CHECK_IN_FREQUENCIES;
}
