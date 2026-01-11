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
  mode: string | undefined;
  loading = false;
  error: string | null = null;

  constructor(
    private consumerService: ConsumerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'];
    this.customerId = this.route.snapshot.params['customerId'];
    this.loading = true;
    this.error = null;

    if (this.mode === 'me') {
      this.consumerService.getMyBills().subscribe({
        next: (data) => {
          this.bills = data; // getMyBills returns List<Bill> directly, not _embedded
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to load your orders. Please try again.';
          this.loading = false;
        }
      });
    } else if (this.customerId) {
      this.consumerService.getBillsByCustomerID(this.customerId).subscribe({
        next: (data) => {
          this.bills = data._embedded.bills;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to load bills.';
          this.loading = false;
        }
      });
    } else {
      this.consumerService.getAllBills().subscribe({
        next: (data) => {
          this.bills = data._embedded.bills;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to load bills.';
          this.loading = false;
        }
      });
    }
  }

  handleBillDetails(bill: any) {
    this.router.navigate(['/bill-details', bill.id]);
  }
}
