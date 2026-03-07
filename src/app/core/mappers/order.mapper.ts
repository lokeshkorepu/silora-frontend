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
        
        productId: i.productId,
        name: i.name,
        price: i.price,

        quantityValue: i.quantityValue,
        quantityUnit: i.quantityUnit,
        orderQuantity: i.orderQuantity,

        imageUrl: i.imageUrl || ''
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
