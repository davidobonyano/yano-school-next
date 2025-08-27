#!/usr/bin/env node

/**
 * Teacher Authentication Test Script
 * 
 * This script helps you test if teacher authentication is working properly.
 * Run this after setting up your authentication configuration.
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

async function testTeacherAuth() {
  console.log('🧪 Teacher Authentication Test\n');
  
  const email = await question('Enter teacher email to test: ');
  const password = await question('Enter password: ');
  
  if (!email || !password) {
    console.log('❌ Both email and password are required.');
    rl.close();
    return;
  }
  
  console.log('\n🔍 Testing authentication...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/teachers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Authentication successful!');
      console.log(`👤 Teacher: ${data.teacher.full_name}`);
      console.log(`🔑 Auth Method: ${data.authMethod}`);
      console.log('\n🎉 Your teacher authentication is working correctly!');
    } else {
      console.log('\n❌ FAILED: Authentication failed');
      console.log(`📝 Error: ${data.error}`);
      
      if (data.details) {
        console.log(`📋 Details: ${data.details}`);
      }
      
      if (data.suggestion) {
        console.log(`💡 Suggestion: ${data.suggestion}`);
      }
      
      if (data.endpoint) {
        console.log(`🔗 Endpoint: ${data.endpoint}`);
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if the teacher exists in the database');
      console.log('2. Verify the password is correct');
      console.log('3. Check if exam portal is configured (if using that method)');
      console.log('4. Look at server logs for more details');
    }
    
  } catch (error) {
    console.log('\n❌ ERROR: Failed to make request');
    console.log('📝 Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your development server is running');
    console.log('2. Check if the API endpoint is accessible');
    console.log('3. Verify your server configuration');
  }
  
  rl.close();
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('💡 Alternative: Use curl or Postman to test the API directly');
  console.log('\nExample curl command:');
  console.log('curl -X POST http://localhost:3000/api/teachers/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email": "teacher@example.com", "password": "password123"}\'');
  process.exit(1);
}

testTeacherAuth().catch(console.error);
