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
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatProgressBarModule
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

  // Si se selecciona "Otro", este valor contendrá el nombre ingresado.
  selectedPresident: string | null = null;
  customPresidentName: string = '';

  selectedTopic: string = '';
  selectedSocialMedia: string = '';
  maxComments: number = 10;
  loadingStatus: string = '';
  
  // Variable para controlar el estado del análisis
  isAnalyzing: boolean = false;

  // Nueva propiedad para el modelo seleccionado
  selectedModel: string = '';

  // Opciones de modelos a elegir
  modelOptions = [
    { id: 'deepseek-r1:1.5b', name: 'DeepSeek R1 con 1.5 billones de parámetros' },
    { id: 'deepseek-r1:7b', name: 'DeepSeek R1 con 7 billones de parámetros' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 con 8 billones de parámetros' },
    { id: 'deepseek-r1:14b', name: 'DeepSeek R1 con 14 billones de parámetros' }
  ];

  socialMediaOptions = [
    { id: 'Youtube', name: 'YouTube', icon: 'youtube.png' },
    { id: 'Reddit', name: 'Reddit', icon: 'reddit.png' },
    { id: 'X', name: 'X', icon: 'x.png' }
  ];

  onSocialMediaChange(socialMediaId: string): void {
    this.selectedSocialMedia = socialMediaId;
  }

  // Lista de presidentes predefinidos
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

  // Actualiza la selección de presidente y limpia el nombre personalizado si se selecciona uno predefinido
  onPresidentChange(presidentId: string | null): void {
    this.selectedPresident = presidentId;
    if (presidentId !== 'Otro') {
      this.customPresidentName = '';
    }
  }

  // Ahora se valida que, si se selecciona "Otro", se haya ingresado un nombre
  canExecuteAnalysis(): boolean {
    const presidentProvided = this.selectedPresident === 'Otro' ? !!this.customPresidentName : !!this.selectedPresident;
    // Se requiere que además se seleccione un modelo (selectedModel)
    return presidentProvided && !!this.selectedTopic && !!this.selectedSocialMedia && !!this.selectedModel && this.maxComments > 0;
  }

  executeAnalysis(): void {
    this.comments = [];
    this.loadingStatus = 'Iniciando análisis...';
    this.isAnalyzing = true;
    console.log('Ejecutando análisis...');

    // Si se seleccionó "Otro", se utiliza el nombre personalizado
    const presidentName = this.selectedPresident === 'Otro' ? this.customPresidentName : this.selectedPresident;

    this.commentsService.analyzeComments(presidentName!, this.selectedTopic, this.selectedSocialMedia, this.maxComments, this.selectedModel)
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
            this.isAnalyzing = false;
          }
        },
        error: (err) => {
          this.loadingStatus = 'Error en el análisis. Verifique la conexión con el servidor.';
          console.error('Error en el análisis:', err);
          this.isAnalyzing = false;
        }
      });
  }

  calculateSentiment(): void {
    this.positiveCount = this.comments.filter(comment => comment.sentimiento === 'positivo').length;
    this.negativeCount = this.comments.filter(comment => comment.sentimiento === 'negativo').length;
    this.neutralCount = this.comments.filter(comment => comment.sentimiento === 'neutral').length;
    this.naCount = this.comments.filter(comment => comment.sentimiento !== 'neutral' && comment.sentimiento !== 'negativo' && comment.sentimiento !== 'positivo').length;
  }

  calculateWordFrequency(): void {
    let excludeTokens: string[] = [];
  
    // Excluir tokens del nombre del presidente
    if (this.selectedPresident === 'Otro' && this.customPresidentName) {
      excludeTokens = this.customPresidentName.split(' ').map(token => token.toLowerCase());
    } else if (this.selectedPresident) {
      const president = this.presidents.find(p => p.id === this.selectedPresident);
      if (president) {
        excludeTokens = president.name.split(' ').map(token => token.toLowerCase());
      }
    }
  
    // Excluir tokens del tema seleccionado
    if (this.selectedTopic) {
      const topicTokens = this.selectedTopic.split(' ').map(token => token.toLowerCase());
      excludeTokens = excludeTokens.concat(topicTokens);
    }
  
    // Recorremos los comentarios y contamos la frecuencia de cada token, excluyendo los tokens filtrados
    this.wordFrequency = this.comments.reduce((acc: { [key: string]: number }, comment: any) => {
      const tokens: string[] = comment.tokens;
      tokens.forEach((token: string) => {
        const lowerToken = token.toLowerCase();
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
      .slice(0, 10);
  }

  updateWordChartData(): void {
    const topWords = this.mostFrequentWords;
    this.wordChartData = {
      labels: topWords.map(word => word.word),
      datasets: [
        {
          data: topWords.map(word => word.count),
          backgroundColor: [
            '#FF4081', '#FF9800', '#03A9F4', '#8BC34A', '#9C27B0',
            '#673AB7', '#009688', '#E91E63', '#00BCD4', '#CDDC39'
          ]
        }
      ]
    };
  }

  updateChartData(): void {
    this.chartData = {
      labels: ['Positivos', 'Negativos', 'Neutrales', 'No analizados'],
      datasets: [
        {
          data: [this.positiveCount, this.negativeCount, this.neutralCount, this.naCount],
          backgroundColor: ['#4CAF50', '#FF0000', '#1034d0', '#9d9d9d']
        }
      ]
    };
  }
}
