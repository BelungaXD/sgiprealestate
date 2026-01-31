# Content Extraction Guide for sgiprealestate.ru

> 📖 **См. также**: [CONTENT_TRANSFER_GUIDE.md](./CONTENT_TRANSFER_GUIDE.md) - Полное руководство по переносу контента

## Step-by-Step Content Transfer Process

### 1. Website Structure Analysis

Visit sgiprealestate.ru and document the following:

#### Main Pages to Extract

- [ ] Home Page (Главная)
- [ ] Properties Catalog (Каталог недвижимости)
- [ ] Areas/Locations (Районы)
- [ ] Services (Услуги)
- [ ] About Us (О нас)
- [ ] Contact (Контакты)
- [ ] Legal Pages (Правовая информация)

### 2. Content Categories to Extract

#### A. Text Content

- [ ] Headlines and titles
- [ ] Descriptions and paragraphs
- [ ] Property details
- [ ] Service descriptions
- [ ] Company information
- [ ] Contact details
- [ ] Legal text

#### B. Media Content

- [ ] Property images
- [ ] Company logos
- [ ] Team photos
- [ ] Area/location images
- [ ] Service icons
- [ ] Background images

#### C. Data Content

- [ ] Property listings with details
- [ ] Pricing information
- [ ] Contact information
- [ ] Service packages
- [ ] Team member information
- [ ] Company statistics

### 3. Translation Requirements

#### Russian to English Translation Needed

- [ ] All page titles and headings
- [ ] Property descriptions
- [ ] Service descriptions
- [ ] Company information
- [ ] Legal documents
- [ ] Contact information
- [ ] Navigation menus

### 4. Content Integration Checklist

#### Home Page Updates

- [ ] Hero section content
- [ ] Company statistics
- [ ] Featured properties
- [ ] Services overview
- [ ] Testimonials
- [ ] Call-to-action sections

#### Properties Section

- [ ] Property listings
- [ ] Property details
- [ ] Pricing information
- [ ] Property images
- [ ] Filter options
- [ ] Search functionality

#### Areas Section

- [ ] Location descriptions
- [ ] Area statistics
- [ ] Amenities information
- [ ] Investment data
- [ ] Location images

#### Services Section

- [ ] Service descriptions
- [ ] Pricing packages
- [ ] Process explanations
- [ ] Service benefits
- [ ] Contact forms

#### About Section

- [ ] Company history
- [ ] Team information
- [ ] Company values
- [ ] Achievements
- [ ] Certifications

#### Contact Section

- [ ] Contact information
- [ ] Office locations
- [ ] Contact forms
- [ ] Social media links
- [ ] Map integration

### 5. Technical Implementation

#### Translation Files Update

- [ ] Update `public/locales/ru/` files
- [ ] Update `public/locales/en/` files
- [ ] Ensure all keys are properly mapped

#### Content Integration

- [ ] Update component props with new content
- [ ] Replace placeholder images with real content
- [ ] Update property data in mock files
- [ ] Integrate real contact information

#### SEO Updates

- [ ] Update meta descriptions
- [ ] Update page titles
- [ ] Update schema markup
- [ ] Update sitemap

### 6. Quality Assurance

#### Content Review

- [ ] Proofread all translated content
- [ ] Verify accuracy of property details
- [ ] Check contact information
- [ ] Validate legal content

#### Technical Testing

- [ ] Test all pages load correctly
- [ ] Verify all images display
- [ ] Test contact forms
- [ ] Check responsive design
- [ ] Validate SEO elements

### 7. Content Extraction Tools

#### Recommended Tools

1. **Manual Copy-Paste**: Most reliable for text content
2. **Browser Developer Tools**: For inspecting page structure
3. **Image Download**: Right-click and save images
4. **Translation Services**: Google Translate or professional services

#### Content Organization

- Create folders for each content type
- Use consistent naming conventions
- Maintain original structure
- Document source URLs

### 8. Implementation Priority

#### Phase 1 (High Priority)

1. Home page content
2. Main navigation
3. Contact information
4. Basic property listings

#### Phase 2 (Medium Priority)

1. Detailed property information
2. Services descriptions
3. About page content
4. Legal pages

#### Phase 3 (Low Priority)

1. Blog content
2. Additional media
3. Advanced features
4. Performance optimization

## Next Steps

1. **Start with Home Page**: Extract and translate the main page content
2. **Update Translation Files**: Add Russian content to locale files
3. **Integrate Content**: Update components with real content
4. **Test and Validate**: Ensure everything works correctly
5. **Iterate**: Continue with other pages systematically

## Notes

- Always maintain backup of original content
- Test each page after integration
- Keep track of what has been completed
- Document any issues or questions
