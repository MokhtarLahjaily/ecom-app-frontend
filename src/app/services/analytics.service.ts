import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, catchError, of } from 'rxjs';

/**
 * Interface représentant les statistiques d'analytics
 * Map de nom de page/produit vers le nombre de visites
 */
export interface AnalyticsStats {
  [key: string]: number;
}

/**
 * Interface pour un événement de page individuel
 */
export interface PageEvent {
  name: string;
  user: string;
  date: string;
  duration: number;
}

/**
 * Service pour récupérer les données analytiques depuis analytics-service
 * via la Gateway Spring Cloud
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly gatewayUrl = 'http://localhost:8888';
  // Accès direct à analytics-service car pas de sécurité sur ce port
  private readonly analyticsBaseUrl = 'http://localhost:8084';
  
  /** Intervalle de rafraîchissement en millisecondes (5 secondes) */
  private readonly REFRESH_INTERVAL = 5000;

  constructor(private http: HttpClient) {}

  /**
   * Récupère un snapshot des statistiques analytiques
   * @returns Observable avec la map des statistiques (page -> count)
   */
  getAnalyticsSnapshot(): Observable<AnalyticsStats> {
    return this.http.get<AnalyticsStats>(`${this.analyticsBaseUrl}/api/analytics/snapshot`)
      .pipe(
        catchError(err => {
          console.error('Erreur lors de la récupération des analytics:', err);
          return of({} as AnalyticsStats);
        })
      );
  }

  /**
   * Récupère les statistiques avec polling automatique toutes les 5 secondes
   * Simule le temps réel avec un intervalle RxJS
   * @returns Observable qui émet les statistiques toutes les 5 secondes
   */
  getAnalyticsWithPolling(): Observable<AnalyticsStats> {
    return interval(this.REFRESH_INTERVAL).pipe(
      startWith(0), // Émettre immédiatement au démarrage
      switchMap(() => this.getAnalyticsSnapshot())
    );
  }

  /**
   * Publie un événement de test pour vérifier le pipeline
   * @returns Observable de la réponse
   */
  publishTestEvent(): Observable<PageEvent> {
    return this.http.get<PageEvent>(`${this.analyticsBaseUrl}/publish`);
  }

  /**
   * Récupère le stream SSE (Server-Sent Events) pour le temps réel
   * Note: Pour SSE, utiliser EventSource directement côté composant
   * @returns URL du endpoint SSE
   */
  getStreamUrl(): string {
    return `${this.analyticsBaseUrl}/api/analytics/stream`;
  }
}
