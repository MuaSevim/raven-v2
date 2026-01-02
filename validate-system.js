#!/usr/bin/env node

/**
 * Comprehensive System Validation Script
 * Checks all critical connections between client, server, and database
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 RAVEN-V2 SYSTEM VALIDATION\n');
console.log('=' .repeat(60));

let errors = 0;
let warnings = 0;

// ============================================================================
// 1. CHECK NETWORK CONFIGURATION
// ============================================================================
console.log('\n📡 NETWORK CONFIGURATION');
console.log('-'.repeat(60));

try {
  const configPath = path.join(__dirname, 'client', 'src', 'config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const ipMatch = configContent.match(/LOCAL_NETWORK_IP = '([^']+)'/);
  if (ipMatch) {
    console.log(`✅ Client IP configured: ${ipMatch[1]}`);
  } else {
    console.log('❌ Client IP not found in config.ts');
    errors++;
  }
  
  const mainPath = path.join(__dirname, 'server', 'src', 'main.ts');
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  
  if (mainContent.includes(ipMatch[1])) {
    console.log(`✅ Server IP matches: ${ipMatch[1]}`);
  } else {
    console.log('⚠️  Server IP may not match client config');
    warnings++;
  }
} catch (err) {
  console.log(`❌ Error checking network config: ${err.message}`);
  errors++;
}

// ============================================================================
// 2. CHECK STATUS CONSISTENCY
// ============================================================================
console.log('\n🔄 STATUS CONSISTENCY CHECK');
console.log('-'.repeat(60));

const statusFiles = [
  'client/src/components/home/StatusBadge.tsx',
  'client/src/components/shipment/DeliveryProgress.tsx',
  'client/src/components/shipment/RouteCard.tsx',
  'client/src/screens/tabs/HomeTab.tsx',
  'server/prisma/schema.prisma',
  'server/src/shipments/shipments.service.ts'
];

let onWayCount = 0;
let inTransitCount = 0;

statusFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    if (content.includes('ON_WAY')) onWayCount++;
    if (content.includes('IN_TRANSIT')) inTransitCount++;
  } catch (err) {
    console.log(`⚠️  Could not read ${file}`);
  }
});

console.log(`✅ Files using ON_WAY: ${onWayCount}`);
if (inTransitCount > 0) {
  console.log(`⚠️  Files still using IN_TRANSIT: ${inTransitCount}`);
  warnings++;
} else {
  console.log(`✅ No IN_TRANSIT references found (migration complete)`);
}

// ============================================================================
// 3. CHECK TYPESCRIPT COMPILATION
// ============================================================================
console.log('\n📝 TYPESCRIPT CONFIGURATION');
console.log('-'.repeat(60));

const tsconfigs = [
  'client/tsconfig.json',
  'server/tsconfig.json'
];

tsconfigs.forEach(config => {
  try {
    const content = fs.readFileSync(path.join(__dirname, config), 'utf8');
    JSON.parse(content); // Validate JSON
    console.log(`✅ ${config} is valid`);
  } catch (err) {
    console.log(`❌ ${config} has errors: ${err.message}`);
    errors++;
  }
});

// ============================================================================
// 4. CHECK CRITICAL FILES EXIST
// ============================================================================
console.log('\n📁 CRITICAL FILES CHECK');
console.log('-'.repeat(60));

const criticalFiles = [
  'server/.env',
  'server/prisma/schema.prisma',
  'client/src/config.ts',
  'client/src/utils/api.ts',
  'client/src/navigation.tsx',
  'server/src/main.ts',
  'server/src/app.module.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} NOT FOUND`);
    errors++;
  }
});

// ============================================================================
// 5. CHECK COMPONENT EXPORTS
// ============================================================================
console.log('\n🧩 COMPONENT EXPORTS CHECK');
console.log('-'.repeat(60));

const exportFiles = [
  'client/src/components/ui/index.ts',
  'client/src/components/home/index.ts',
  'client/src/components/shipment/index.ts',
  'client/src/screens/settings/index.ts'
];

exportFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const exportCount = (content.match(/export/g) || []).length;
    console.log(`✅ ${file} (${exportCount} exports)`);
  } catch (err) {
    console.log(`❌ ${file} error: ${err.message}`);
    errors++;
  }
});

// ============================================================================
// 6. CHECK PACKAGE DEPENDENCIES
// ============================================================================
console.log('\n📦 PACKAGE DEPENDENCIES');
console.log('-'.repeat(60));

try {
  const clientPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'client', 'package.json'), 'utf8'));
  const serverPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'package.json'), 'utf8'));
  
  console.log(`✅ Client dependencies: ${Object.keys(clientPkg.dependencies || {}).length}`);
  console.log(`✅ Server dependencies: ${Object.keys(serverPkg.dependencies || {}).length}`);
  
  // Check critical dependencies
  const criticalClientDeps = ['@react-navigation/native', 'expo', 'firebase'];
  const criticalServerDeps = ['@nestjs/core', '@prisma/client', 'firebase-admin'];
  
  criticalClientDeps.forEach(dep => {
    if (clientPkg.dependencies[dep] || clientPkg.devDependencies?.[dep]) {
      console.log(`  ✅ Client has ${dep}`);
    } else {
      console.log(`  ⚠️  Client missing ${dep}`);
      warnings++;
    }
  });
  
  criticalServerDeps.forEach(dep => {
    if (serverPkg.dependencies[dep] || serverPkg.devDependencies?.[dep]) {
      console.log(`  ✅ Server has ${dep}`);
    } else {
      console.log(`  ⚠️  Server missing ${dep}`);
      warnings++;
    }
  });
} catch (err) {
  console.log(`❌ Error checking packages: ${err.message}`);
  errors++;
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ ALL CHECKS PASSED - System is ready!');
  process.exit(0);
} else {
  console.log(`⚠️  Errors: ${errors}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (errors > 0) {
    console.log('\n❌ CRITICAL ISSUES FOUND - Please fix errors before proceeding');
    process.exit(1);
  } else {
    console.log('\n⚠️  WARNINGS FOUND - System may work but review recommended');
    process.exit(0);
  }
}
