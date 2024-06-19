import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paciente } from '../../core/models/paciente';
import { PacienteService } from '../../core/services/paciente.service';
import { TipoTest } from '../../core/models/tipo_test';
import { TipoTestService } from '../../core/services/tipo-test.service';
import { Pregunta } from '../../core/models/pregunta';
import { PreguntaService } from '../../core/services/pregunta.service';
import { Alternativa } from '../../core/models/alternativa';
import { AlternativaService } from '../../core/services/alternativa.service';
import { Clasificacion } from '../../core/models/clasificacion';
import { ClasificacionService } from '../../core/services/clasificacion.service';
import { Test } from '../../core/models/test';
import { TestService } from '../../core/services/test.service';
import { Respuesta } from '../../core/models/respuesta';
import { RespuestaService } from '../../core/services/respuesta.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-select-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-test.component.html',
  styleUrl: './select-test.component.css'
})
export class SelectTestComponent implements OnInit {
  tiposTest: TipoTest[] = [];
  selectedTest: TipoTest | null = null;
  preguntas: Pregunta[] = [];
  alternativas: Alternativa[] = [];
  isTestSelected = false;
  preguntasDelTest: Pregunta[] = [];
  date: Date = new Date();
  pacientes: Paciente[] = [];
  paciente: Paciente | null = null;
  clasificaciones: Clasificacion[] = [];
  tests: Test[] = [];

  constructor(
    private tipoTestService: TipoTestService,
    private preguntaService: PreguntaService,
    private alternativaService: AlternativaService,
    private pacienteService: PacienteService,
    private clasificacionService: ClasificacionService,
    private testService: TestService,
    private respuestaService: RespuestaService
  ) {}

  ngOnInit() {
    this.tipoTestService.getTiposTest().subscribe((data: any) => {
      this.tiposTest = data.tipos;
    });
  }

  selectTest(test: TipoTest) {
    this.isTestSelected = true;
    this.selectedTest = test;

    console.log('Test seleccionado:', test);

    this.preguntaService.getPreguntas().subscribe((data:any) => {
      this.preguntas = data.preguntas
      this.preguntas = this.preguntas.filter(preguntas => preguntas.id_tipo_test === test.id_tipo_test);
    });

    this.alternativaService.getAlternativas().subscribe((data:any) => {
      this.alternativas = data.alternativas
      this.alternativas = this.alternativas.filter(alternativas => alternativas.id_tipo_test === test.id_tipo_test);
    });

    this.clasificacionService.getClasificaciones().subscribe((data: any) => {
      this.clasificaciones = data.clasificaciones;
      this.clasificaciones = this.clasificaciones.filter(clasificacion => clasificacion.id_tipo_test === test.id_tipo_test);
    });


  }

  cancelTest() {
    this.isTestSelected = false;
    this.selectedTest = null;
    this.preguntas = [];
    this.alternativas = [];
    this.clasificaciones = [];
  }

  calculateResult() {
    let result = 0;

    this.preguntas.forEach((pregunta) => {
      const selectedOption = (document.querySelector(`input[name="pregunta${pregunta.id_pregunta}"]:checked`) as HTMLInputElement);

      if (selectedOption) {
        const idAlternativa = parseInt(selectedOption.value, 10);
        const alternativa = this.alternativas.find((alternativa) => alternativa.id_alternativa === idAlternativa);

        if (alternativa) {
          result += alternativa.puntaje;
        }
      }
    });

    console.log('Resultado:', result);
    return result;
  }

  calculateInterpretacion() {
    const result = this.calculateResult();

    const clasificacion = this.clasificaciones.find(clasif => {
      return result >= clasif.minimo && result <= clasif.maximo;
    });

    return clasificacion ? clasificacion.interpretacion : '';
  }

  getNewTestId(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.testService.getTests().subscribe((data: any) => {
        resolve(data.tests.length + 1);
      });
    });
  }

  async generateTestJson() {
    const respuestas:any[] = [];
    let allAnswered = true;

    for (const pregunta of this.preguntas) {
      const selectedOption = (document.querySelector(`input[name="pregunta${pregunta.id_pregunta}"]:checked`) as HTMLInputElement);
  
      if (selectedOption) {
        const idAlternativa = parseInt(selectedOption.value, 10);
        const idTest = await this.getNewTestId();
        respuestas.push({
          id_test: idTest,
          id_pregunta: pregunta.id_pregunta,
          id_alternativa: idAlternativa
        });
      } else {
        allAnswered = false;
      }
    }

    if (allAnswered) {
      const result = this.calculateResult();
      const interpretacion = this.calculateInterpretacion();
      const id_tipo_test = this.selectedTest?.id_tipo_test;
      const token = localStorage.getItem('token');
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      this.pacienteService.getPacientes().subscribe((data: any) => {
        this.pacientes = data.pacientes;
        this.paciente = this.pacientes.find((paciente) => paciente.id_usuario === payload.id_usuario) || null;
        const testResult = {
          id_tipo_test: id_tipo_test,
          id_paciente: this.paciente?.id_paciente,
          resultado: result,
          interpretacion: interpretacion,
          fecha: this.date.getFullYear() + '-' + (this.date.getMonth() + 1) + '-' + this.date.getDate(),
        };
        console.log(JSON.stringify(testResult, null, 2));
        console.log(JSON.stringify(respuestas, null, 2));

        this.testService.insertTest(testResult).subscribe((data: any) => {
          console.log(data.message);
          respuestas.forEach((respuesta) => {
            this.respuestaService.insertRespuesta(respuesta).subscribe((data: any) => {
              console.log(data.message);
            });
          });
          Swal.fire({
            title: '¡Test enviado!',
            text: '¡Gracias por responder el test!',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
          this.cancelTest();
        });
      });
    } else {
      alert('Por favor, responda todas las preguntas');
    }
  }

}
