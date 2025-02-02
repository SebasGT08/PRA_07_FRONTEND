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
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Importa el módulo

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
    MatButtonModule,
    MatProgressBarModule  // Agrégalo a los imports
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  comments: any[] = [];
  positiveCount: number = 0;
  negativeCount: number = 0;
  neutralCount: number = 0;
  naCount: number = 0;
  wordFrequency: { [key: string]: number } = {};
  selectedPresident: string | null = null;
  selectedTopic: string = '';
  selectedSocialMedia: string = '';
  maxComments: number = 10;
  loadingStatus: string = '';
  
  // Variable para controlar el estado del análisis
  isAnalyzing: boolean = false;

  socialMediaOptions = [
    { id: 'Youtube', name: 'YouTube', icon: 'youtube.png' },
    { id: 'Reddit', name: 'Reddit', icon: 'reddit.png' },
    { id: 'X', name: 'X', icon: 'x.png' }
  ];

  onSocialMediaChange(socialMediaId: string): void {
    this.selectedSocialMedia = socialMediaId;
  }

  presidents = [
    { id: 'Trump', name: 'Donald Trump', image: 'Trump.webp' },
    { id: 'Bukele', name: 'Nayib Bukele', image: 'Bukele.jpg' },
    { id: 'Milei', name: 'Javier Milei', image: 'Milei.jpg' }
  ];

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

  executeAnalysis(): void {
    this.comments=[];
    this.loadingStatus = 'Iniciando análisis...';
    this.isAnalyzing = true; // Inicia el estado de análisis
    console.log('Ejecutando análisis...');

    this.commentsService.analyzeComments(this.selectedPresident!, this.selectedTopic, this.selectedSocialMedia, this.maxComments)
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos en el componente:', data);
          this.loadingStatus = data.status;

          if (data.status === 'Completado') {
            this.comments = data.data;
            this.calculateSentiment();
            this.calculateWordFrequency();
            this.updateChartData();
            this.updateWordChartData();
            this.loadingStatus = 'Análisis completado.';
            console.log('Análisis completado en el componente.');
            this.isAnalyzing = false; // Finaliza el estado de análisis
          }
        },
        error: (err) => {
          this.loadingStatus = 'Error en el análisis. Verifique la conexión con el servidor.';
          console.error('Error en el análisis:', err);
          this.isAnalyzing = false; // Finaliza el estado en caso de error
        }
      });
  }

  canExecuteAnalysis(): boolean {
    return !!this.selectedPresident && !!this.selectedTopic && !!this.selectedSocialMedia && this.maxComments > 0;
  }

  onPresidentChange(presidentId: string | null): void {
    this.selectedPresident = presidentId;
  }

  calculateSentiment(): void {
    this.positiveCount = this.comments.filter(comment => comment.sentimiento === 'positivo').length;
    this.negativeCount = this.comments.filter(comment => comment.sentimiento === 'negativo').length;
    this.neutralCount = this.comments.filter(comment => comment.sentimiento === 'neutral').length;
    this.naCount = this.comments.filter(comment => comment.sentimiento != 'neutral' && comment.sentimiento != 'negativo' && comment.sentimiento != 'positivo').length;
    
  }

  calculateWordFrequency(): void {
    // Construimos un arreglo con las palabras (en minúsculas) que corresponden al nombre del presidente
    let excludeTokens: string[] = [];
    if (this.selectedPresident) {
      const president = this.presidents.find(p => p.id === this.selectedPresident);
      if (president) {
        // Se separa el nombre completo en palabras y se convierten a minúsculas para una comparación consistente
        excludeTokens = president.name.split(' ').map(token => token.toLowerCase());
      }
    }
  
    // Recorremos los comentarios y contamos la frecuencia de cada token, excluyendo los tokens filtrados
    this.wordFrequency = this.comments.reduce((acc: { [key: string]: number }, comment: any) => {
      // Se asume que cada comentario tiene la propiedad "tokens" que ya es un arreglo de palabras
      const tokens: string[] = comment.tokens;
      tokens.forEach((token: string) => {
        const lowerToken = token.toLowerCase();
        // Se considera solo tokens con más de 3 caracteres y que no formen parte del nombre del presidente
        if (lowerToken.length > 3 && !excludeTokens.includes(lowerToken)) {
          acc[lowerToken] = (acc[lowerToken] || 0) + 1;
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
      labels: ['Positivos', 'Negativos','Neutrales','No analizados'],
      datasets: [
        {
          data: [this.positiveCount, this.negativeCount, this.neutralCount, this.naCount],
          backgroundColor: ['#4CAF50', '#FF0000', '#1034d0', '#9d9d9d']
        }
      ]
    };
  }
}
