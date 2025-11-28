import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsumerService } from '../services/consumer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  customers: any;

  constructor(private consumerService: ConsumerService, private router: Router) { }

  ngOnInit(): void {
    this.consumerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data._embedded.customers;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  handleViewBills(customer: any) {
    this.router.navigate(['/bills', customer.id]);
  }
}
