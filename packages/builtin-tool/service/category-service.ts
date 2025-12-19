import { categories } from '../tools';

export const getBuiltinToolCategories = () => {
  return categories.map((category) => ({
    category: category.category,
    name: category.name,
    icon: category.icon,
  }));
};
