import { read, write } from './storageService.js';

const PORTFOLIO_STORAGE_KEY = 'portfolio';

function getPortfolioItems() {
    return read(PORTFOLIO_STORAGE_KEY, []);
}

function savePortfolioItem(item) {
    const updated = [{ id: `${Date.now()}`, ...item }, ...getPortfolioItems()];
    write(PORTFOLIO_STORAGE_KEY, updated);
    return updated;
}

export { getPortfolioItems, savePortfolioItem, PORTFOLIO_STORAGE_KEY };
export default { getPortfolioItems, savePortfolioItem, PORTFOLIO_STORAGE_KEY };