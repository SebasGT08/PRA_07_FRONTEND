import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommentsService } from '../services/comments.service';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
    NgChartsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatTableModule,
    FormsModule,
    MatRadioModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  comments: any[] = [];
  positiveCount: number = 0;
  negativeCount: number = 0;
  wordFrequency: { [key: string]: number } = {};
  selectedPresident: string | null = null;
  selectedTopic: string = '';
  selectedSocialMedia: string = '';
  maxComments: number = 10;
  loadingStatus: string = '';
  socialMediaOptions: string[] = ['Youtube', 'Reddit', 'X'];

  // Lista de presidentes
  presidents = [
    { id: '1', name: 'Donald Trump', image: 'Trump.webp' },
    { id: '2', name: 'Nayib Bukele', image: 'Bukele.jpg' },
    { id: '3', name: 'Javier Milei', image: 'Milei.jpg' }
  ];

  // Configuración de gráficos
  chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Positivos', 'Negativos'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#4CAF50', '#FF0000']
      }
    ]
  };

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  wordChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF4081', '#FF9800', '#03A9F4', '#8BC34A', '#9C27B0']
      }
    ]
  };

  wordChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  wordChartType: ChartType = 'bar';
  chartType: ChartType = 'doughnut';
  displayedColumns: string[] = ['sentiment', 'text'];

  constructor(private commentsService: CommentsService) {}

  ngOnInit(): void {}

  // Método para iniciar el análisis
  executeAnalysis(): void {
    this.loadingStatus = 'Iniciando análisis...';
    console.log('Ejecutando análisis...');  // Log
  
    this.commentsService.analyzeComments(this.selectedPresident!, this.selectedTopic, this.selectedSocialMedia, this.maxComments)
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos en el componente:', data);  // Log
          this.loadingStatus = data.status;
  
          if (data.status === 'Completado') {
            this.comments = data.data;
            this.calculateSentiment();
            this.calculateWordFrequency();
            this.updateChartData();
            this.updateWordChartData();
            this.loadingStatus = 'Análisis completado.';
            console.log('Análisis completado en el componente.');  // Log
          }
        },
        error: (err) => {
          this.loadingStatus = 'Error en el análisis. Intenta nuevamente.';
          console.error('Error en el análisis:', err);  // Log
        }
      });
  }
  

  // Verifica si el formulario es válido para ejecutar el análisis
  canExecuteAnalysis(): boolean {
    return !!this.selectedPresident && !!this.selectedTopic && !!this.selectedSocialMedia && this.maxComments > 0;
  }

  // Método para manejar el cambio de presidente
  onPresidentChange(presidentId: string | null): void {
    this.selectedPresident = presidentId;
  }

  calculateSentiment(): void {
    this.positiveCount = this.comments.filter(comment => comment.sentimiento === 'positivo').length;
    this.negativeCount = this.comments.filter(comment => comment.sentimiento === 'negativo').length;
  }

  calculateWordFrequency(): void {
    this.wordFrequency = this.comments.reduce((acc: any, comment: any) => {
      const words = comment.comentario.split(' ');
      words.forEach((word: string) => {
        if (word.length > 3) {
          acc[word] = (acc[word] || 0) + 1;
        }
      });
      return acc;
    }, {});
  }

  get mostFrequentWords(): { word: string, count: number }[] {
    return Object.entries(this.wordFrequency)
      .map(([word, count]) => ({ word, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  updateWordChartData(): void {
    const topWords = this.mostFrequentWords;
    this.wordChartData = {
      labels: topWords.map(word => word.word),
      datasets: [
        {
          data: topWords.map(word => word.count),
          backgroundColor: ['#FF4081', '#FF9800', '#03A9F4', '#8BC34A', '#9C27B0']
        }
      ]
    };
  }

  updateChartData(): void {
    this.chartData = {
      labels: ['Positivos', 'Negativos'],
      datasets: [
        {
          data: [this.positiveCount, this.negativeCount],
          backgroundColor: ['#4CAF50', '#FF0000']
        }
      ]
    };
  }
}
