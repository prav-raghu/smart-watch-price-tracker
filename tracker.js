const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');

class SamsungWatchPriceTracker {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36';
    
    this.watchModels = {
      'Galaxy Watch 6 (40mm)': { normalPrice: 7999, threshold: 6500 },
      'Galaxy Watch 6 (44mm)': { normalPrice: 8499, threshold: 7000 },
      'Galaxy Watch 6 Classic (43mm)': { normalPrice: 10999, threshold: 9000 },
      'Galaxy Watch 6 Classic (47mm)': { normalPrice: 11999, threshold: 9800 },
      'Galaxy Watch 7 (40mm)': { normalPrice: 8499, threshold: 7000 },
      'Galaxy Watch 7 (44mm)': { normalPrice: 8999, threshold: 7500 },
      'Galaxy Watch Ultra': { normalPrice: 13999, threshold: 11500 }
    };
    
    this.retailers = {
      'Samsung': 'https://www.samsung.com/za/watches/galaxy-watch/',
      'Takealot': 'https://www.takealot.com/all?qsearch=samsung+galaxy+watch',
      'Incredible Connection': 'https://www.incredible.co.za/catalogsearch/result/?q=samsung+galaxy+watch',
      'Makro': 'https://www.makro.co.za/search/?text=samsung+galaxy+watch',
      'OneDayOnly': 'https://www.onedayonly.co.za/search?query=samsung+galaxy+watch'
    };
    
    this.priceHistoryFile = path.join(__dirname, 'price_history_za.json');
    this.priceHistory = this.loadPriceHistory();
  }

  loadPriceHistory() {
    try {
      if (fs.existsSync(this.priceHistoryFile)) {
        const data = fs.readFileSync(this.priceHistoryFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    }

    // Create empty price history structure if file doesn't exist or has errors
    const history = {};
    for (const model in this.watchModels) {
      history[model] = {};
      for (const retailer in this.retailers) {
        history[model][retailer] = [];
      }
    }
    return history;
  }

  savePriceHistory() {
    try {
      fs.writeFileSync(this.priceHistoryFile, JSON.stringify(this.priceHistory, null, 2), 'utf8');
      console.log('Price history saved successfully');
    } catch (error) {
      console.error('Error saving price history:', error);
    }
  }

  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  extractPriceFromText(text) {
    // Extract price from text like "R 7,999" or "R7999"
    const priceMatch = text.match(/R\s?([0-9,\s]+)/i);
    if (priceMatch && priceMatch[1]) {
      return parseFloat(priceMatch[1].replace(/,|\s/g, ''));
    }
    return null;
  }

  async checkSamsungSite(model) {
    try {
      const html = await this.fetchPage(this.retailers['Samsung']);
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Note: This is a placeholder selector - you need to inspect Samsung's actual page structure
      const productCards = $('.product-card');
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const titleElement = card.find('.product-title');
        
        if (titleElement.length && titleElement.text().includes(model)) {
          const priceElement = card.find('.sale-price');
          if (priceElement.length) {
            return this.extractPriceFromText(priceElement.text());
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error checking Samsung site for ${model}:`, error);
      return null;
    }
  }

  async checkTakealot(model) {
    try {
      const html = await this.fetchPage(this.retailers['Takealot']);
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Note: This is a placeholder selector - you need to inspect Takealot's actual page structure
      const productCards = $('.product-card');
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const titleElement = card.find('.product-title');
        
        if (titleElement.length && titleElement.text().includes(model)) {
          const priceElement = card.find('.price');
          if (priceElement.length) {
            return this.extractPriceFromText(priceElement.text());
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error checking Takealot for ${model}:`, error);
      return null;
    }
  }

  async checkIncredible(model) {
    try {
      const html = await this.fetchPage(this.retailers['Incredible Connection']);
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Note: This is a placeholder selector - you need to inspect Incredible's actual page structure
      const productCards = $('.product-item');
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const titleElement = card.find('.product-name');
        
        if (titleElement.length && titleElement.text().includes(model)) {
          const priceElement = card.find('.price');
          if (priceElement.length) {
            return this.extractPriceFromText(priceElement.text());
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error checking Incredible Connection for ${model}:`, error);
      return null;
    }
  }

  async checkMakro(model) {
    try {
      const html = await this.fetchPage(this.retailers['Makro']);
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Note: This is a placeholder selector - you need to inspect Makro's actual page structure
      const productCards = $('.product-card');
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const titleElement = card.find('.name');
        
        if (titleElement.length && titleElement.text().includes(model)) {
          const priceElement = card.find('.price');
          if (priceElement.length) {
            return this.extractPriceFromText(priceElement.text());
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error checking Makro for ${model}:`, error);
      return null;
    }
  }

  async checkOneDayOnly(model) {
    try {
      const html = await this.fetchPage(this.retailers['OneDayOnly']);
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Note: This is a placeholder selector - you need to inspect OneDayOnly's actual page structure
      const productCards = $('.product-item');
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const titleElement = card.find('.product-name');
        
        if (titleElement.length && titleElement.text().includes(model)) {
          const priceElement = card.find('.current-price');
          if (priceElement.length) {
            return this.extractPriceFromText(priceElement.text());
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error checking OneDayOnly for ${model}:`, error);
      return null;
    }
  }

  async checkPrices() {
    const dealsFound = [];
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    for (const [model, details] of Object.entries(this.watchModels)) {
      const threshold = details.threshold;
      const normalPrice = details.normalPrice;
      
      console.log(`Checking prices for ${model}...`);
      
      // Check each retailer for the current model
      const prices = {
        'Samsung': await this.checkSamsungSite(model),
        'Takealot': await this.checkTakealot(model),
        'Incredible Connection': await this.checkIncredible(model),
        'Makro': await this.checkMakro(model),
        'OneDayOnly': await this.checkOneDayOnly(model)
      };
      
      // Update price history and check for deals
      for (const [retailer, price] of Object.entries(prices)) {
        if (price !== null) {
          // Add to price history
          if (!this.priceHistory[model][retailer]) {
            this.priceHistory[model][retailer] = [];
          }
          
          this.priceHistory[model][retailer].push({
            date: currentDate,
            price: price
          });
          
          // Check if this is a good deal
          const discountPercentage = ((normalPrice - price) / normalPrice) * 100;
          
          if (price <= threshold) {
            const dealInfo = {
              model: model,
              retailer: retailer,
              price: price,
              normalPrice: normalPrice,
              discount: `${discountPercentage.toFixed(1)}%`,
              savings: `R ${(normalPrice - price).toFixed(2)}`
            };
            
            dealsFound.push(dealInfo);
            console.log(`DEAL FOUND! ${model} at ${retailer} for R ${price.toFixed(2)} - ${discountPercentage.toFixed(1)}% off!`);
          }
        }
      }
    }
    
    this.savePriceHistory();
    return dealsFound;
  }

  async findBestDeals() {
    const allPrices = [];
    
    for (const [model, details] of Object.entries(this.watchModels)) {
      const normalPrice = details.normalPrice;
      
      // Check each retailer for the current model
      const prices = {
        'Samsung': await this.checkSamsungSite(model),
        'Takealot': await this.checkTakealot(model),
        'Incredible Connection': await this.checkIncredible(model),
        'Makro': await this.checkMakro(model),
        'OneDayOnly': await this.checkOneDayOnly(model)
      };
      
      // Find the best price across all retailers
      let bestPrice = Infinity;
      let bestRetailer = null;
      
      for (const [retailer, price] of Object.entries(prices)) {
        if (price !== null && price < bestPrice) {
          bestPrice = price;
          bestRetailer = retailer;
        }
      }
      
      if (bestRetailer) {
        const discountPercentage = ((normalPrice - bestPrice) / normalPrice) * 100;
        
        allPrices.push({
          model: model,
          retailer: bestRetailer,
          price: bestPrice,
          normalPrice: normalPrice,
          discount: `${discountPercentage.toFixed(1)}%`,
          savings: `R ${(normalPrice - bestPrice).toFixed(2)}`
        });
      }
    }
    
    // Sort by discount percentage (highest first)
    return allPrices.sort((a, b) => {
      const discountA = parseFloat(a.discount);
      const discountB = parseFloat(b.discount);
      return discountB - discountA;
    });
  }

  async sendEmailAlert(deals, emailTo) {
    if (!deals || deals.length === 0) {
      return;
    }
    
    const emailFrom = 'your_email@gmail.com'; // Replace with your email
    
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailFrom,
        pass: 'your_app_password' // Use app password if 2FA is enabled
      }
    });
    
    // Construct email body
    let body = 'Samsung Watch Price Alerts in South Africa:\n\n';
    
    deals.forEach(deal => {
      body += `${deal.model} at ${deal.retailer}\n`;
      body += `Price: R ${deal.price.toFixed(2)} (Normal: R ${deal.normalPrice.toFixed(2)})\n`;
      body += `Discount: ${deal.discount} (You save ${deal.savings})\n\n`;
    });
    
    const mailOptions = {
      from: emailFrom,
      to: emailTo,
      subject: `Samsung Watch Deal Alert - ${new Date().toISOString().split('T')[0]}`,
      text: body
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email alert sent successfully!');
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async generatePriceReport() {
    const currentDate = new Date().toISOString().split('T')[0];
    const reportFile = path.join(__dirname, `price_report_${currentDate}.txt`);
    
    let report = `SAMSUNG WATCH PRICE REPORT - ${currentDate}\n`;
    report += '=========================================\n\n';
    
    // Get best deals for all models
    const bestDeals = await this.findBestDeals();
    
    report += 'BEST CURRENT DEALS (RANKED BY DISCOUNT)\n';
    report += '----------------------------------------\n';
    
    bestDeals.forEach((deal, index) => {
      report += `${index + 1}. ${deal.model} - R ${deal.price.toFixed(2)} at ${deal.retailer}\n`;
      report += `   Discount: ${deal.discount} off R ${deal.normalPrice.toFixed(2)} (You save ${deal.savings})\n\n`;
    });
    
    // Write report to file
    fs.writeFileSync(reportFile, report, 'utf8');
    console.log(`Price report generated: ${reportFile}`);
    
    return reportFile;
  }
  
  async run(checkInterval = 86400000, emailTo = null) {
    /**
     * Run the price checker at specified intervals
     * 
     * @param {number} checkInterval - Time between checks in milliseconds (default: 24 hours)
     * @param {string} emailTo - Email address to send alerts to (optional)
     */
    while (true) {
      console.log(`Checking prices at ${new Date().toLocaleString()}`);
      const deals = await this.checkPrices();
      
      if (emailTo && deals.length > 0) {
        await this.sendEmailAlert(deals, emailTo);
      }
      
      // Generate a daily price report once per day
      await this.generatePriceReport();
      
      console.log(`Next check in ${checkInterval / 3600000} hours`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
}

// Example usage
async function main() {
  const tracker = new SamsungWatchPriceTracker();
  
  // Run once to check current prices
  const deals = await tracker.checkPrices();
  console.log('Deals found:', deals);
  
  // Generate a price report
  await tracker.generatePriceReport();
  
  // If you want to run continuously with email alerts, uncomment this line:
  // await tracker.run(12 * 3600 * 1000, 'your_email@example.com'); // Check every 12 hours
}

// Run the program
main().catch(error => {
  console.error('Error in main program:', error);
});

module.exports = SamsungWatchPriceTracker;
