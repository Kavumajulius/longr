import fs from "fs";

async function run() {
  const envLocal = fs.readFileSync(".env.local", "utf-8");
  for (const line of envLocal.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }

  const { Whop } = await import("@whop/sdk");
  const whopsdk = new Whop({ apiKey: process.env.WHOP_API_KEY });
  
  const promosToCreate = [10, 15, 20, 25, 30, 35, 40, 45];
  const activePromos = new Map();

  try {
    console.log("Fetching existing promo codes...");
    let hasMore = true;
    let cursor: string | undefined = undefined;
    const existingPromos = [];
    
    while (hasMore) {
        const response: any = await whopsdk.promoCodes.list({ 
            company_id: process.env.WHOP_COMPANY_ID!,
            // @ts-ignore
            after: cursor,
        });
        existingPromos.push(...response.data);
        if (response.page_info?.has_next_page) {
            cursor = response.page_info.end_cursor;
        } else {
            hasMore = false;
        }
    }
    
    console.log(`Found ${existingPromos.length} total existing promos.`);
    
    // We only care about percentage promos, one_per_customer, product scope, duration once
    for (const discount of promosToCreate) {
        const baseCode = `LONGRINTRO${discount}`;
        const amount_off = discount;
        
        let targetCode = baseCode;
        let suffix = 1;
        
        // Find if this code already exists and is active/matches perfectly
        let matched = false;
        
        while (!matched) {
            const existing = existingPromos.find(p => p.code?.toUpperCase() === targetCode);
            
            if (existing) {
                // Check if perfectly matches
                if (
                    existing.status === "active" &&
                    existing.amount_off === amount_off &&
                    existing.promo_type === "percentage" &&
                    existing.duration === "once" &&
                    existing.one_per_customer === true &&
                    existing.product?.id === process.env.WHOP_PRODUCT_ID
                ) {
                    console.log(`✅ Reusing existing PERFECT match: ${targetCode} (${existing.id})`);
                    activePromos.set(discount, existing.code);
                    matched = true;
                    break;
                } else {
                    console.log(`⚠️ Code ${targetCode} exists but does not match exactly or is archived (Status: ${existing.status}). Attempting next version...`);
                    suffix++;
                    targetCode = `${baseCode}V${suffix}`;
                }
            } else {
                // Code doesn't exist, we can create it
                console.log(`✨ Creating NEW promo code: ${targetCode} for ${discount}% off`);
                
                const createRes = await fetch("https://api.whop.com/api/v1/promo_codes", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.WHOP_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        code: targetCode,
                        amount_off: amount_off,
                        promo_type: "percentage",
                        one_per_customer: true,
                        product_id: process.env.WHOP_PRODUCT_ID,
                        company_id: process.env.WHOP_COMPANY_ID,
                        new_users_only: false,
                        base_currency: "usd",
                        unlimited_stock: true,
                        promo_duration_months: 1 // We verified this maps to duration: "once"
                    })
                });
                const newData = await createRes.json();
                
                if (newData.error) {
                    console.error(`❌ Error creating ${targetCode}:`, newData.error);
                    process.exit(1);
                }
                
                // Verify duration
                if (newData.duration !== "once") {
                     console.error(`🚨 FATAL: Created promo ${targetCode} but Whop reported duration: '${newData.duration}' (expected 'once'). Aborting!`);
                     process.exit(1);
                }
                
                console.log(`✅ Successfully created: ${targetCode} (${newData.id}) with duration: ${newData.duration}`);
                activePromos.set(discount, newData.code);
                matched = true;
            }
        }
    }
    
    console.log("\\n=== FINAL PROMO MAPPINGS ===");
    for (const [discount, code] of activePromos.entries()) {
        console.log(`WHOP_PROMO_CODE_${discount}="${code.toUpperCase()}"`);
    }
    
  } catch (e) {
    console.error("SDK Error:", e);
  }
}

run();
