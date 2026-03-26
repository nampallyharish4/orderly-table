import chickenBiryani from '@/assets/images/chicken-biryani.jpg';
import vegBiryani from '@/assets/images/veg-biryani.jpg';
import fishBiryani from '@/assets/images/fish-biryani.jpg';
import paneerBiryani from '@/assets/images/paneer-biryani.jpg';
import eggBiryani from '@/assets/images/egg-biryani.jpg';
import butterChicken from '@/assets/images/butter-chicken.jpg';
import chicken65 from '@/assets/images/chicken-65.jpg';
import paneerButterMasala from '@/assets/images/paneer-butter-masala.jpg';
import chickenManchurian from '@/assets/images/chicken-manchurian.jpg';
import gobiManchurian from '@/assets/images/gobi-manchurian.jpg';
import paneer65 from '@/assets/images/paneer-65.jpg';
import dalFry from '@/assets/images/dal-fry.jpg';
import garlicNaan from '@/assets/images/garlic-naan.jpg';
import tandooriRoti from '@/assets/images/tandoori-roti.jpg';
import palakPaneer from '@/assets/images/palak-paneer.jpg';
import tandooriChicken from '@/assets/images/tandoori-chicken.jpg';
import muttonCurry from '@/assets/images/mutton-curry.jpg';
import chickenTikka from '@/assets/images/chicken-tikka.jpg';
import butterRoti from '@/assets/images/butter-roti.jpg';
import mushroomMasala from '@/assets/images/mushroom-masala.jpg';

const imageMap: Record<string, string> = {
  'chicken dum biryani': chickenBiryani,
  'chicken fry biryani': chickenBiryani,
  'egg biryani': eggBiryani,
  'fish biryani': fishBiryani,
  'boneless chicken biryani': chickenBiryani,
  'veg biryani': vegBiryani,
  'paneer biryani': paneerBiryani,
  'biryani rice': vegBiryani,
  'veg manchuria': gobiManchurian,
  'gobi manchuria': gobiManchurian,
  'paneer manchuria': paneerButterMasala,
  'paneer sticks': paneer65,
  'paneer majestics': paneer65,
  'aloo 65': paneer65,
  'spring rolls': chicken65,
  'paneer tikka': chickenTikka,
  'chilli paneer': paneerButterMasala,
  'aloo spring roll': chicken65,
  'mashroom manchuria': gobiManchurian,
  'mushroom manchuria': gobiManchurian,
  'mashroom 65': paneer65,
  'mushroom 65': paneer65,
  'paneer 65': paneer65,
  'chicken manchuria': chickenManchurian,
  'chicken 65': chicken65,
  'chickens majestic': chicken65,
  'chicken 555': chicken65,
  'dragon chicken': chickenManchurian,
  'kaju chicken': chickenManchurian,
  'chicken fry': chicken65,
  'chilli chicken': chickenManchurian,
  'butter chicken': butterChicken,
  'chicken masala bone': butterChicken,
  'chicken tikka masala': chickenTikka,
  'kadai chicken': butterChicken,
  'egg masala': eggBiryani,
  'egg burji': eggBiryani,
  'tomato curry': paneerButterMasala,
  'dal fry': dalFry,
  'mixed veg curry': mushroomMasala,
  'palak paneer': palakPaneer,
  'paneer butter masala': paneerButterMasala,
  'kaju tomato': paneerButterMasala,
  'kaju paneer': paneerButterMasala,
  'plain naan': garlicNaan,
  'butter naan': garlicNaan,
  'garlic naan': garlicNaan,
  'tandoori roti': tandooriRoti,
  'butter roti': butterRoti,
  'rumali roti': tandooriRoti,
  'kulcha': garlicNaan,
  'laccha paratha': tandooriRoti,
  'tandoori chicken': tandooriChicken,
  'tangdi kabab': tandooriChicken,
  'chicken tikka': chickenTikka,
  'jeera rice': vegBiryani,
  'veg fried rice': vegBiryani,
  'tomato rice': vegBiryani,
  'pudina rice': vegBiryani,
  'paneer fried rice': paneerBiryani,
  'kaju fried rice': vegBiryani,
  'kaju paneer fried rice': paneerBiryani,
  'veg manchurian rice': gobiManchurian,
  'egg fried rice': eggBiryani,
  'chicken fried rice': chickenBiryani,
};

export function getMenuItemImage(itemName: string): string | undefined {
  const normalizedName = itemName.toLowerCase()
    .replace(/\s*\(single\)\s*/gi, '')
    .replace(/\s*\(full\)\s*/gi, '')
    .replace(/\s*\(half\)\s*/gi, '')
    .replace(/\s*\(family pack\)\s*/gi, '')
    .replace(/\s*\(jumbo pack\)\s*/gi, '')
    .replace(/\s*\(2p\)\s*/gi, '')
    .replace(/\s*\(4p\)\s*/gi, '')
    .replace(/\s*\(5p\)\s*/gi, '')
    .trim();
  
  return imageMap[normalizedName];
}
