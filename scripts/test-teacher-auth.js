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
    // Test login
    const loginResponse = await fetch('http://localhost:3000/api/teachers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const loginData = await loginResponse.json();
    
    console.log('📊 Login Response Status:', loginResponse.status);
    console.log('📊 Login Response Data:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.sessionToken) {
      console.log('\n✅ SUCCESS: Login successful!');
      console.log(`👤 Teacher: ${loginData.teacher.full_name}`);
      console.log(`🔑 Auth Method: ${loginData.authMethod}`);
      console.log(`🎫 Session Token: ${loginData.sessionToken.substring(0, 20)}...`);
      
      // Test fetching teacher data with the session token
      console.log('\n🔍 Testing teacher data fetch...');
      
      const meResponse = await fetch('http://localhost:3000/api/teachers/me', {
        headers: {
          'Authorization': `Bearer ${loginData.sessionToken}`
        }
      });
      
      const meData = await meResponse.json();
      
      console.log('📊 Me Response Status:', meResponse.status);
      console.log('📊 Me Response Data:', JSON.stringify(meData, null, 2));
      
      if (meResponse.ok) {
        console.log('\n🎉 SUCCESS: Teacher data fetch successful!');
        console.log(`👤 Name: ${meData.teacher.name}`);
        console.log(`🆔 ID: ${meData.teacher.id}`);
        console.log(`📧 Email: ${meData.teacher.email}`);
        console.log(`🏫 School: ${meData.teacher.schoolName}`);
      } else {
        console.log('\n❌ FAILED: Teacher data fetch failed');
        console.log(`📝 Error: ${meData.error}`);
      }
      
    } else {
      console.log('\n❌ FAILED: Login failed');
      console.log(`📝 Error: ${loginData.error}`);
      
      if (loginData.details) {
        console.log(`📋 Details: ${loginData.details}`);
      }
      
      if (loginData.suggestion) {
        console.log(`💡 Suggestion: ${loginData.suggestion}`);
      }
      
      if (loginData.endpoint) {
        console.log(`🔗 Endpoint: ${loginData.endpoint}`);
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if the teacher exists in the database');
      console.log('2. Verify the password is correct');
      console.log('3. Check if exam portal is configured (if using that method)');
      console.log('4. Look at server logs for more details');
    }
    
  } catch (error) {
    console.log('\n❌ ERROR: Failed to make request');
    console.log('Error details:', error.message);
    console.log('\n🔧 Make sure your development server is running on http://localhost:3000');
  }
  
  rl.close();
}

// Check if running directly
if (require.main === module) {
  testTeacherAuth().catch(console.error);
}

module.exports = { testTeacherAuth };
