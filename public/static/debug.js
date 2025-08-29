// Debug script to test Forms object
console.log('Debug script loaded');
console.log('Forms object:', typeof Forms);
console.log('Forms methods:', Forms ? Object.keys(Forms) : 'Forms is undefined');
if (Forms) {
  console.log('setupHomepageSearch:', typeof Forms.setupHomepageSearch);
  console.log('setupBrowseFilters:', typeof Forms.setupBrowseFilters);
}