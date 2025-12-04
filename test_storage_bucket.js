// Test script to check Supabase storage bucket
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageBucket() {
  try {
    console.log('Testing Supabase storage bucket...');
    
    // List buckets to see if 'attachments' exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // Check if 'attachments' bucket exists
    const attachmentsBucket = buckets.find(b => b.name === 'attachments');
    
    if (!attachmentsBucket) {
      console.error('❌ "attachments" bucket not found!');
      console.log('You need to create a storage bucket named "attachments" in your Supabase dashboard.');
      return;
    }
    
    console.log('✅ "attachments" bucket found!');
    console.log('Bucket details:', attachmentsBucket);
    
    // Test listing files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('attachments')
      .list();
    
    if (filesError) {
      console.error('Error listing files:', filesError);
      return;
    }
    
    console.log('Files in attachments bucket:', files);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStorageBucket(); 