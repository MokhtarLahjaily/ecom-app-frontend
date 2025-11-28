import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsumerService } from '../services/consumer.service';
import { ActivatedRoute } from '@angular/router';
import { Bill } from '../models/bill.model';

@Component({
  selector: 'app-bills-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bills-details.component.html',
  styleUrl: './bills-details.component.css'
})
export class BillsDetailsComponent implements OnInit {
  billId!: number;
  billDetails!: Bill;

  constructor(
    private consumerService: ConsumerService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.billId = this.route.snapshot.params['billId'];
    this.consumerService.getBillDetails(this.billId).subscribe({
      next: (data) => {
        this.billDetails = data;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  calculateTotal(): number {
    if (!this.billDetails || !this.billDetails.productItems) {
      return 0;
    }
    return this.billDetails.productItems.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);
  }
}
