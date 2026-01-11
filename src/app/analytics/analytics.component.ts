import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnalyticsService, AnalyticsStats } from '../services/analytics.service';

/**
 * Interface pour les données du graphique
 */
interface ChartData {
  name: string;
  value: number;
  color: string;
}

/**
 * Composant Dashboard Analytics
 * Affiche les statistiques de visites par produit/page avec des graphiques
 * Rafraîchissement automatique toutes les 5 secondes
 */
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  
  /** Signal pour les données brutes des analytics */
  readonly analyticsData = signal<AnalyticsStats>({});
  
  /** Signal pour l'état de chargement */
  readonly isLoading = signal<boolean>(true);
  
  /** Signal pour les erreurs */
  readonly error = signal<string | null>(null);
  
  /** Signal pour le dernier rafraîchissement */
  readonly lastUpdate = signal<Date | null>(null);
  
  /** Signal pour le mode de visualisation */
  readonly chartMode = signal<'bar' | 'pie'>('bar');
  
  /** Couleurs pour les graphiques */
  private readonly colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#0ea5e9'
  ];

  /** Données formatées pour le graphique */
  readonly chartData = computed<ChartData[]>(() => {
    const data = this.analyticsData();
    return Object.entries(data)
      .map(([name, value], index) => ({
        name,
        value,
        color: this.colors[index % this.colors.length]
      }))
      .sort((a, b) => b.value - a.value); // Trier par valeur décroissante
  });

  /** Valeur maximale pour le scaling du bar chart */
  readonly maxValue = computed(() => {
    const data = this.chartData();
    return data.length > 0 ? Math.max(...data.map(d => d.value)) : 1;
  });

  /** Total des visites */
  readonly totalVisits = computed(() => {
    return this.chartData().reduce((sum, item) => sum + item.value, 0);
  });

  /** Nombre de pages/produits uniques */
  readonly uniquePages = computed(() => {
    return this.chartData().length;
  });

  private subscription?: Subscription;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Démarre le polling des données analytics
   */
  private startPolling(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.subscription = this.analyticsService.getAnalyticsWithPolling().subscribe({
      next: (data) => {
        this.analyticsData.set(data);
        this.lastUpdate.set(new Date());
        this.isLoading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('Erreur polling analytics:', err);
        this.error.set('Impossible de charger les données analytiques');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Arrête le polling
   */
  private stopPolling(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Rafraîchit manuellement les données
   */
  refresh(): void {
    this.isLoading.set(true);
    this.analyticsService.getAnalyticsSnapshot().subscribe({
      next: (data) => {
        this.analyticsData.set(data);
        this.lastUpdate.set(new Date());
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du rafraîchissement');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Bascule entre les modes bar chart et pie chart
   */
  toggleChartMode(): void {
    this.chartMode.update(mode => mode === 'bar' ? 'pie' : 'bar');
  }

  /**
   * Calcule le pourcentage pour le pie chart
   */
  getPercentage(value: number): number {
    const total = this.totalVisits();
    return total > 0 ? (value / total) * 100 : 0;
  }

  /**
   * Calcule l'angle de rotation pour un segment du pie chart
   */
  getPieRotation(index: number): number {
    const data = this.chartData();
    let rotation = 0;
    for (let i = 0; i < index; i++) {
      rotation += this.getPercentage(data[i].value) * 3.6; // 360/100 = 3.6
    }
    return rotation;
  }

  /**
   * Génère le style CSS pour un segment du pie chart
   */
  getPieSegmentStyle(item: ChartData, index: number): { [key: string]: string } {
    const percentage = this.getPercentage(item.value);
    const rotation = this.getPieRotation(index);
    
    return {
      '--percentage': `${percentage}`,
      '--rotation': `${rotation}deg`,
      '--color': item.color
    } as { [key: string]: string };
  }

  /**
   * Calcule la largeur de la barre en pourcentage
   */
  getBarWidth(value: number): number {
    const max = this.maxValue();
    return max > 0 ? (value / max) * 100 : 0;
  }
}
