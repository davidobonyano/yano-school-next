#!/usr/bin/env node

/**
 * Teacher Authentication Setup Script
 * 
 * This script helps you set up teacher authentication using your existing Supabase setup.
 * Teachers can use the same credentials they use in your exam portal.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Teacher Authentication Setup\n');
  
  console.log('✅ GREAT NEWS! Your setup is much simpler now.\n');
  console.log('The system will automatically use your existing Supabase configuration');
  console.log('(NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).\n');
  
  console.log('This means:');
  console.log('• Teachers can use the same email/password they use in your exam portal');
  console.log('• No need to configure separate environment variables');
  console.log('• Automatic authentication using your existing Supabase setup\n');
  
  const choice = await question('What would you like to do?\n1. Test authentication\n2. Set up local passwords for teachers without Supabase accounts\n3. Exit\n\nChoose option (1, 2, or 3): ');
  
  if (choice === '1') {
    await testAuthentication();
  } else if (choice === '2') {
    await setupLocalCredentials();
  } else if (choice === '3') {
    console.log('👋 Setup complete! Teachers can now login using their existing credentials.');
  } else {
    console.log('❌ Invalid choice. Setup complete anyway!');
  }
  
  rl.close();
}

async function testAuthentication() {
  console.log('\n🧪 Testing Authentication\n');
  
  console.log('To test if authentication is working:');
  console.log('1. Make sure your development server is running');
  console.log('2. Try to login with a teacher account using their exam portal credentials');
  console.log('3. Check the server logs for authentication details\n');
  
  const testNow = await question('Would you like to test now? (y/n): ');
  
  if (testNow.toLowerCase() === 'y') {
    console.log('\n📝 Test Steps:');
    console.log('1. Go to your teacher login page');
    console.log('2. Enter a teacher email and password (from your exam portal)');
    console.log('3. Check if login succeeds');
    console.log('4. Look at your server console for detailed logs\n');
    
    console.log('💡 If you get errors, check:');
    console.log('• Your Supabase configuration in .env.local');
    console.log('• That the teacher exists in your Supabase auth users');
    console.log('• Server logs for specific error messages');
  }
}

async function setupLocalCredentials() {
  console.log('\n🔑 Setting up Local Teacher Credentials\n');
  
  console.log('This is for teachers who don\'t have Supabase accounts yet.');
  console.log('You can use the set-password API endpoint to set passwords.\n');
  
  const email = await question('Enter teacher email: ');
  const password = await question('Enter password for this teacher: ');
  
  if (!email || !password) {
    console.log('❌ Both email and password are required.');
    return;
  }
  
  console.log('\n📝 To set the password, make a POST request to:');
  console.log('POST /api/teachers/set-password');
  console.log('Body: { "email": "' + email + '", "password": "' + password + '" }');
  
  console.log('\n💡 You can use curl, Postman, or your browser\'s developer tools.');
  console.log('\nExample curl command:');
  console.log(`curl -X POST http://localhost:3000/api/teachers/set-password \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email": "${email}", "password": "${password}"}'`);
  
  console.log('\n⚠️  Note: This endpoint is temporary and should be protected in production.');
}

main().catch(console.error);
