import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-earnings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings-page.component.html',
  styleUrl: './earnings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarningsPageComponent {
  readonly totalEarnings = signal(18420);
  readonly pendingPayout = signal(3412);
  readonly lastPayout = signal(12500);

  readonly history = signal([
    { id: 1, type: 'Subscription Share', amount: 840, date: new Date(Date.now() - 86400000), status: 'Completed' },
    { id: 2, type: 'Reader Tip', amount: 150, date: new Date(Date.now() - 86400000 * 2), status: 'Completed' },
    { id: 3, type: 'Subscription Share', amount: 920, date: new Date(Date.now() - 86400000 * 3), status: 'Completed' },
    { id: 4, type: 'Boost Bonus', amount: 500, date: new Date(Date.now() - 86400000 * 5), status: 'Completed' },
    { id: 5, type: 'Subscription Share', amount: 780, date: new Date(Date.now() - 86400000 * 7), status: 'Completed' },
  ]);

  readonly breakdown = signal([
    { label: 'Member Subscriptions', amount: 13262, color: 'emerald' },
    { label: 'Referral Program', amount: 3316, color: 'blue' },
    { label: 'Community Tips', amount: 1842, color: 'amber' },
  ]);
}
