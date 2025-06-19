/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   const { discount, sale_price, quantity } = purchase;
   const discountFactor  = 1 - discount  / 100;
   return sale_price * quantity * discountFactor ;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    if (index === 0) {
        return bonus = (profit / 100 ) * 15;
    } else if (index === 1 || index === 2) {
        return bonus = (profit / 100 ) * 10;
    } else if (index === total - 1) {
        return bonus = 0;
    } else {
        return bonus = (profit / 100 ) * 5;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    };

    if (!data.purchase_records || data.purchase_records.length === 0) {
        throw new Error('Массив purchase_records пуст');
    }

    if (!options || typeof options !== 'object') {
        throw new Error('Опции не предоставлены или имеют неправильный тип.');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Функции calculateRevenue и calculateBonus должны быть предоставлены и должны быть функциями.');
    }

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count +=1;
        
        let totalRevenue = 0;
        let totalProfit = 0;
        
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const revenue = calculateSimpleRevenue(item, product);
            totalRevenue += revenue;

            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;
            totalProfit  += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });

        seller.revenue += totalRevenue;
        seller.profit += totalProfit;

        return console.log(seller.revenue);
        });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);

        const productsSoldArray = Object.entries(seller.products_sold).map(([sku, quantity]) => ({ sku, quantity }));
        productsSoldArray.sort((a, b) => b.quantity - a.quantity);
        const top10Products = productsSoldArray.slice(0, 10);

        seller.top_products = top10Products;
      
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: Math.round(seller.revenue * 10) / 10,
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
};