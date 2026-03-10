/**
 * SEO.JS - Dynamic Meta Tag Management
 * Updates <head> elements for client-side rendered pages
 */

/**
 * Updates the document metadata for SEO and Social Sharing
 * @param {Object} data - Object containing title, description, image, url
 */
function updateSEOMetadata(data) {
    if (!data) return;

    const {
        title = 'متجري | My Store',
        description = 'أفضل متجر إلكتروني لتلبية جميع احتياجاتك بجودة عالية وأسعار منافسة.',
        image = 'https://YOUR_USERNAME.github.io/REPO_NAME/images/banners/banner1.jpg',
        url = window.location.href
    } = data;

    // 1. Update Basic Meta Tags
    document.title = title;
    
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', 'تسوق, اونلاين, منتجات, اردن, shopping');

    // 2. Update Open Graph Tags (Facebook/LinkedIn)
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:type', 'product'); // or 'website'

    // 3. Update Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 4. Update Canonical Link
    let linkTag = document.querySelector("link[rel='canonical']");
    if (linkTag) {
        linkTag.href = url;
    } else {
        linkTag = document.createElement('link');
        linkTag.rel = 'canonical';
        linkTag.href = url;
        document.head.appendChild(linkTag);
    }
}

/**
 * Helper function to create or update a meta tag
 * @param {String} attribute - 'name' or 'property'
 * @param {String} key - The key (e.g., 'description', 'og:title')
 * @param {String} content - The content value
 */
function setMetaTag(attribute, key, content) {
    let element = document.querySelector(`meta[${attribute}="${key}"]`);
    
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
}

// ==========================================
// USAGE EXAMPLES (Integration points)
// ==========================================

/* 
   In products.js, inside loadProductPage():
   
   const productData = {
       title: product[nameField],
       description: product[shortDescField],
       image: product.main_image_url,
       url: window.location.href
   };
   updateSEOMetadata(productData);

   In category.html script:
   
   const categoryData = {
       title: category[nameField] + ' | متجري',
       description: `تصفح جميع منتجات ${category[nameField]}`,
       image: category.image_url,
       url: window.location.href
   };
   updateSEOMetadata(categoryData);
*/