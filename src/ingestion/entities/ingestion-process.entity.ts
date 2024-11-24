import { Document } from "../../documents/entities/document.entity";
import { User } from "../../user/entites/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum IngestionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('ingestion_processes')
export class IngestionProcess {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Document)
    document: Document;

    @ManyToOne(() => User)
    triggeredBy: { id: string, role: string, email: string };

    @Column({
        type: 'enum',
        enum: IngestionStatus,
        default: IngestionStatus.PENDING,
    })
    status: IngestionStatus;

    @Column({ nullable: true })
    errorMessage: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}