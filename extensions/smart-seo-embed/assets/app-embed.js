// SmartSEO App Embed JavaScript
(function() {
  const APP_HANDLE = 'smart-seo'

  // Helper to ensure a meta tag exists or is updated
  function ensureMetaTag(property, content, nameAttr = false) {
    let tag = document.querySelector(`meta[${nameAttr ? 'name' : 'property'}="${property}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(nameAttr ? 'name' : 'property', property)
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', content)
  }

  // Main SmartSEO object
  window.SmartSEO = {
    config: {},
    
    init: function() {
      console.log('🚀 SmartSEO initialized')
      this.loadConfig()
      this.applyOptimizations()
      this.trackPageView()
      console.log('✅ SmartSEO optimization complete')
    },

    loadConfig: function() {
      const configElement = document.querySelector(`script[id^="${APP_HANDLE}-config-"]`)
      if (configElement && configElement.textContent) {
        try {
          this.config = JSON.parse(configElement.textContent)
          console.log('⚙️ SmartSEO config loaded:', this.config)
        } catch (e) {
          console.error('❌ Failed to parse SmartSEO config:', e)
        }
      }
    },

    applyOptimizations: function() {
      console.log('📝 Applying SEO optimizations...')
      this.optimizeMetaTags()
      this.setupStructuredData()
    },

    optimizeMetaTags: function() {
      // Basic Open Graph and Twitter Card tags
      ensureMetaTag('og:site_name', this.config.shop || document.title)
      ensureMetaTag('og:type', this.config.pageType === 'product' ? 'product' : 'website')
      ensureMetaTag('og:url', window.location.href)
      ensureMetaTag('twitter:card', 'summary_large_image')
      ensureMetaTag('twitter:site', this.config.shop || '')
      
      console.log('📝 Meta tags optimized')
    },

    setupStructuredData: function() {
      // Basic WebPage structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": document.title,
        "url": window.location.href,
        "description": document.querySelector('meta[name="description"]')?.content || document.title
      }

      // Add product-specific structured data
      if (this.config.pageType === 'product') {
        Object.assign(structuredData, {
          "@type": "Product",
          "name": document.title
        })
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(structuredData)
      document.head.appendChild(script)
      
      console.log('🔗 Structured data added')
    },

    trackPageView: function() {
      console.log('📊 Page view tracked:', {
        shop: this.config.shop,
        pageType: this.config.pageType,
        locale: this.config.locale,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
      // TODO: Send to backend API for analytics
    }
  }

  // Initialize SmartSEO when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SmartSEO.init())
  } else {
    window.SmartSEO.init()
  }
})()
