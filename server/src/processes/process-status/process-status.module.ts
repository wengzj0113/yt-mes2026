import { Module } from '@nestjs/common';
import { ProcessStatusService } from './process-status.service';
import { ProcessStatusController } from './process-status.controller';
import { BatchingModule } from '../batching/batching.module';
import { CoatingModule } from '../coating/coating.module';
import { RollerPressingModule } from '../roller-pressing/roller-pressing.module';
import { SlittingModule } from '../slitting/slitting.module';
import { SortingModule } from '../sorting/sorting.module';
import { ElectrodeModule } from '../electrode/electrode.module';
import { WindingModule } from '../winding/winding.module';
import { AssemblyModule } from '../assembly/assembly.module';
import { BakingModule } from '../baking/baking.module';
import { InjectionModule } from '../injection/injection.module';
import { WrappingModule } from '../wrapping/wrapping.module';
import { FormationModule } from '../formation/formation.module';
import { GradingModule } from '../grading/grading.module';

@Module({
  imports: [
    BatchingModule,
    CoatingModule,
    RollerPressingModule,
    SlittingModule,
    SortingModule,
    ElectrodeModule,
    WindingModule,
    AssemblyModule,
    BakingModule,
    InjectionModule,
    WrappingModule,
    FormationModule,
    GradingModule,
  ],
  providers: [ProcessStatusService],
  controllers: [ProcessStatusController],
  exports: [ProcessStatusService],
})
export class ProcessStatusModule {}
