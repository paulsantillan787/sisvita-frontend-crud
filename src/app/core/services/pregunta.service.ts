import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Pregunta } from '../models/pregunta';
import { MODEL, SERVICE } from '../constants/api';

@Injectable({
  providedIn: 'root'
})
export class PreguntaService {
  readonly URL: string = MODEL.PREGUNTA
  headers: HttpHeaders;
  
  constructor(private http:HttpClient) {
    const token = localStorage.getItem('token');
    this.headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getPreguntas(): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(this.URL + SERVICE.GET, { headers: this.headers });
  }

  insertPregunta(form:any) {
    return this.http.post<Pregunta>(this.URL + SERVICE.POST, form, { headers: this.headers });
  }

  updatePregunta(form:any, id:number) {
    return this.http.put<Pregunta>(this.URL + SERVICE.PUT + id, form, { headers: this.headers });
  }

  deletePregunta(id:number) {
    return this.http.delete<Pregunta>(this.URL + SERVICE.DELETE + id, { headers: this.headers });
  }
}
