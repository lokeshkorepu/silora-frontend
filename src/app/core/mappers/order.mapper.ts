import { OrderDTO } from '../dto/order.dto';
import { Order } from '../models/order.model';

export class OrderMapper {

  static fromDTO(dto: OrderDTO): Order {
    return {
      id: dto.id,
      date: dto.createdAt,
      total: dto.totalAmount,
      status: OrderMapper.mapStatus(dto.status),
      items: dto.items.map(i => ({
        id: i.productId,
        name: 'Unknown product',   // backend will expand later
        price: i.price,
        quantity: i.quantity
      }))
    };
  }

  private static mapStatus(
    status: OrderDTO['status']
  ): Order['status'] {
    switch (status) {
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'RETURNED': return 'Returned';
    }
  }
}
