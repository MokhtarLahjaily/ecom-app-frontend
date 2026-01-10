import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsumerService } from '../services/consumer.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  bills: any;
  customerId!: number;

  constructor(
    private consumerService: ConsumerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'];
    this.customerId = this.route.snapshot.params['customerId'];

    if (mode === 'me') {
      this.consumerService.getMyBills().subscribe({
        next: (data) => {
          this.bills = data; // getMyBills returns List<Bill> directly, not _embedded
        },
        error: (err) => {
          console.error(err);
        }
      });
    } else if (this.customerId) {
      this.consumerService.getBillsByCustomerID(this.customerId).subscribe({
        next: (data) => {
          this.bills = data._embedded.bills;
        },
        error: (err) => {
          console.error(err);
        }
      });
    } else {
      this.consumerService.getAllBills().subscribe({
        next: (data) => {
          this.bills = data._embedded.bills;
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  handleBillDetails(bill: any) {
    this.router.navigate(['/bill-details', bill.id]);
  }
}
