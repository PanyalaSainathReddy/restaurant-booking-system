export enum CuisineType {
  INDIAN = "Indian",
  CHINESE = "Chinese",
  ITALIAN = "Italian",
  MEXICAN = "Mexican",
  JAPANESE = "Japanese",
  THAI = "Thai",
  AMERICAN = "American",
}

export enum LocationEnum {
  BANGALORE = "Bangalore",
  MUMBAI = "Mumbai",
  DELHI = "Delhi",
  HYDERABAD = "Hyderabad",
  CHENNAI = "Chennai",
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | "";
  cuisine_types: CuisineType[];
  rating: number;
  cost_for_two: number;
  image_url: string | "";
  is_vegetarian: boolean;
  location: LocationEnum;
  opening_time: string; // in HH:MM format
  closing_time: string; // in HH:MM format
  is_active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
