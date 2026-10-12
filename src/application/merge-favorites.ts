import { User } from "../domain/models";
import { ShopGateway } from "./ports/shop-gateway";

export async function mergeFavorites(
  shop: ShopGateway,
  user: User,
  guestFavorites: string[],
) {
  for (const id of guestFavorites.filter((id) => !user.favorites.includes(id)))
    user = await shop.favorite(id, true);
  return user;
}
