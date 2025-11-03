#!/usr/bin/env node

/**
 * Content Integration Script for SGIP Real Estate
 * This script helps integrate content from sgiprealestate.ru into the current website
 */

const fs = require('fs');
const path = require('path');

// Content integration configuration
const integrationConfig = {
  // Source content directory (where extracted content will be stored)
  sourceDir: path.join(__dirname, '..', 'extracted-content'),
  
  // Target directories
  localesDir: path.join(__dirname, '..', 'public', 'locales'),
  componentsDir: path.join(__dirname, '..', 'src', 'components'),
  pagesDir: path.join(__dirname, '..', 'src', 'pages'),
  
  // Content mapping
  contentMapping: {
    'home': {
      source: 'home.json',
      target: 'home.json',
      components: ['HeroSection', 'StatsSection', 'AdvantagesSection', 'FeaturedProperties', 'PartnersSection', 'CTASection']
    },
    'properties': {
      source: 'properties.json',
      target: 'properties.json',
      components: ['PropertyFilters', 'PropertyGrid', 'PropertyCard', 'PropertyPagination']
    },
    'areas': {
      source: 'areas.json',
      target: 'areas.json',
      components: ['AreaCard', 'AreaStats', 'AreaHero', 'AreaMap']
    },
    'services': {
      source: 'services.json',
      target: 'services.json',
      components: ['ServiceCard', 'ServiceProcess', 'ServiceFeatures', 'ServiceCTA']
    },
    'about': {
      source: 'about.json',
      target: 'about.json',
      components: ['CompanySection', 'TeamSection', 'AchievementsSection', 'PartnersSection', 'CertificationsSection']
    },
    'contact': {
      source: 'contact.json',
      target: 'contact.json',
      components: ['ContactInfo', 'ContactForm', 'OfficeMap', 'SocialLinks']
    }
  }
};

// Function to integrate content from extracted files
function integrateContent() {
  console.log('🔄 Starting content integration...');
  
  // Check if source directory exists
  if (!fs.existsSync(integrationConfig.sourceDir)) {
    console.log('❌ Source directory not found. Please extract content first.');
    console.log('Run: node scripts/extract-content.js');
    return;
  }
  
  // Process each content type
  Object.entries(integrationConfig.contentMapping).forEach(([contentType, config]) => {
    console.log(`\n📝 Processing ${contentType}...`);
    
    const sourceFile = path.join(integrationConfig.sourceDir, config.source);
    const targetFile = path.join(integrationConfig.localesDir, 'ru', config.target);
    
    if (fs.existsSync(sourceFile)) {
      try {
        // Read extracted content
        const extractedContent = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
        
        // Read existing target file
        let targetContent = {};
        if (fs.existsSync(targetFile)) {
          targetContent = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        }
        
        // Merge content
        const mergedContent = mergeContent(targetContent, extractedContent);
        
        // Write merged content
        fs.writeFileSync(targetFile, JSON.stringify(mergedContent, null, 2));
        console.log(`✅ ${contentType} content integrated successfully`);
        
        // Update components if needed
        updateComponents(contentType, mergedContent);
        
      } catch (error) {
        console.error(`❌ Error processing ${contentType}:`, error.message);
      }
    } else {
      console.log(`⚠️  Source file not found: ${config.source}`);
    }
  });
  
  console.log('\n🎉 Content integration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the integrated content');
  console.log('2. Test the website functionality');
  console.log('3. Update any missing content manually');
  console.log('4. Deploy the updated website');
}

// Function to merge content objects
function mergeContent(target, source) {
  const merged = { ...target };
  
  Object.keys(source).forEach(key => {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      merged[key] = mergeContent(target[key] || {}, source[key]);
    } else {
      merged[key] = source[key];
    }
  });
  
  return merged;
}

// Function to update components with new content
function updateComponents(contentType, content) {
  const componentMap = {
    'home': {
      'HeroSection': ['hero.title', 'hero.subtitle', 'hero.cta'],
      'StatsSection': ['stats.title', 'stats.subtitle', 'stats.items'],
      'AdvantagesSection': ['advantages.title', 'advantages.subtitle', 'advantages.items'],
      'FeaturedProperties': ['featured.title', 'featured.subtitle', 'featured.properties'],
      'PartnersSection': ['partners.title', 'partners.subtitle', 'partners.items'],
      'CTASection': ['cta.title', 'cta.subtitle', 'cta.buttons']
    },
    'properties': {
      'PropertyFilters': ['filters.title', 'filters.options'],
      'PropertyGrid': ['grid.title', 'grid.subtitle'],
      'PropertyCard': ['card.title', 'card.features', 'card.actions'],
      'PropertyPagination': ['pagination.prev', 'pagination.next', 'pagination.info']
    },
    'areas': {
      'AreaCard': ['card.title', 'card.description', 'card.features'],
      'AreaStats': ['stats.title', 'stats.subtitle', 'stats.items'],
      'AreaHero': ['hero.title', 'hero.subtitle', 'hero.cta'],
      'AreaMap': ['map.title', 'map.subtitle', 'map.markers']
    },
    'services': {
      'ServiceCard': ['card.title', 'card.description', 'card.features'],
      'ServiceProcess': ['process.title', 'process.steps'],
      'ServiceFeatures': ['features.title', 'features.items'],
      'ServiceCTA': ['cta.title', 'cta.subtitle', 'cta.buttons']
    },
    'about': {
      'CompanySection': ['company.title', 'company.description', 'company.mission', 'company.vision'],
      'TeamSection': ['team.title', 'team.subtitle', 'team.members'],
      'AchievementsSection': ['achievements.title', 'achievements.subtitle', 'achievements.items'],
      'PartnersSection': ['partners.title', 'partners.subtitle', 'partners.items'],
      'CertificationsSection': ['certifications.title', 'certifications.subtitle', 'certifications.items']
    },
    'contact': {
      'ContactInfo': ['contactInfo.title', 'contactInfo.subtitle', 'contactInfo.items'],
      'ContactForm': ['forms.general.title', 'forms.general.fields'],
      'OfficeMap': ['map.title', 'map.subtitle', 'map.offices'],
      'SocialLinks': ['social.title', 'social.subtitle', 'social.links']
    }
  };
  
  const components = componentMap[contentType];
  if (components) {
    console.log(`  🔧 Updating components for ${contentType}...`);
    
    Object.entries(components).forEach(([componentName, contentKeys]) => {
      console.log(`    📝 ${componentName}: ${contentKeys.length} content keys`);
      // Here you would update the actual component files
      // For now, we just log the information
    });
  }
}

// Function to validate content integration
function validateIntegration() {
  console.log('\n🔍 Validating content integration...');
  
  const validationResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Check if all required files exist
  Object.entries(integrationConfig.contentMapping).forEach(([contentType, config]) => {
    const targetFile = path.join(integrationConfig.localesDir, 'ru', config.target);
    
    if (fs.existsSync(targetFile)) {
      try {
        const content = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
        
        // Basic validation
        if (Object.keys(content).length > 0) {
          validationResults.passed++;
          console.log(`✅ ${contentType}: Content loaded successfully`);
        } else {
          validationResults.failed++;
          validationResults.errors.push(`${contentType}: Empty content file`);
          console.log(`❌ ${contentType}: Empty content file`);
        }
      } catch (error) {
        validationResults.failed++;
        validationResults.errors.push(`${contentType}: ${error.message}`);
        console.log(`❌ ${contentType}: ${error.message}`);
      }
    } else {
      validationResults.failed++;
      validationResults.errors.push(`${contentType}: File not found`);
      console.log(`❌ ${contentType}: File not found`);
    }
  });
  
  console.log(`\n📊 Validation Results:`);
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  
  if (validationResults.errors.length > 0) {
    console.log(`\n🚨 Errors:`);
    validationResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  return validationResults;
}

// Function to generate content report
function generateReport() {
  console.log('\n📊 Generating content integration report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    contentTypes: {},
    summary: {
      totalTypes: 0,
      integratedTypes: 0,
      missingTypes: 0
    }
  };
  
  Object.entries(integrationConfig.contentMapping).forEach(([contentType, config]) => {
    const targetFile = path.join(integrationConfig.localesDir, 'ru', config.target);
    const exists = fs.existsSync(targetFile);
    
    report.contentTypes[contentType] = {
      exists,
      file: config.target,
      components: config.components
    };
    
    report.summary.totalTypes++;
    if (exists) {
      report.summary.integratedTypes++;
    } else {
      report.summary.missingTypes++;
    }
  });
  
  // Write report to file
  const reportFile = path.join(__dirname, '..', 'content-integration-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`📄 Report saved to: ${reportFile}`);
  console.log(`📈 Summary: ${report.summary.integratedTypes}/${report.summary.totalTypes} content types integrated`);
  
  return report;
}

// Main function
function main() {
  console.log('🏠 SGIP Real Estate Content Integration Tool');
  console.log('==========================================');
  
  const command = process.argv[2];
  
  switch (command) {
    case 'integrate':
      integrateContent();
      break;
    case 'validate':
      validateIntegration();
      break;
    case 'report':
      generateReport();
      break;
    case 'all':
      integrateContent();
      validateIntegration();
      generateReport();
      break;
    default:
      console.log('\n📋 Available commands:');
      console.log('  integrate  - Integrate content from extracted files');
      console.log('  validate   - Validate content integration');
      console.log('  report     - Generate integration report');
      console.log('  all        - Run all commands');
      console.log('\n💡 Usage: node scripts/integrate-content.js [command]');
  }
}

// Run the integration tool
if (require.main === module) {
  main();
}

module.exports = {
  integrateContent,
  validateIntegration,
  generateReport,
  integrationConfig
};
