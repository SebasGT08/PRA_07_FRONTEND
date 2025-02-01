import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  constructor(private http: HttpClient,) {}

  analyzeComments(presidente: string, tema: string, red_social: string, max_comments: number): Observable<any> {
    const url = 'http://127.0.0.1:5000/analyze';
    const body = JSON.stringify({
      presidente: presidente,
      tema: tema,
      red_social: red_social,
      max_comments: max_comments
    });
  
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
  
      let buffer = '';
  
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          buffer += xhr.responseText;
  
          const events = buffer.split('\n');
          buffer = events.pop() || '';
  
          events.forEach(event => {
            console.log('Evento recibido:', event);
  
            // Detectar el fin del stream
            if (event === '[DONE]') {
              console.log('Stream finalizado.');
              observer.complete();
              xhr.abort();
              return;
            }
  
            try {
              const data = JSON.parse(event);
              console.log('Datos parseados:', data);
              observer.next(data);
  
              if (data.status === 'Completado') {
                console.log('Evento de completado recibido.');
                observer.complete();
                xhr.abort();
              }
            } catch (e) {
              console.error('Error procesando evento:', e);
            }
          });
        }
      };
  
      xhr.onerror = (error) => {
        observer.error(new Error('Error en la conexión con el servidor.'));
        console.error('Error en la conexión:', error);
        xhr.abort();
      };
  
      xhr.send(body);
  
      return () => {
        xhr.abort();
      };
    });
  }
  
  
}