import { User } from "../../user/entites/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('documents')
export class Document {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    fileName: string;

    @Column()
    filePath: string;

    @Column()
    mimeType: string;

    @Column({ type: 'bigint' })
    fileSize: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploadedBy' })
    uploadedBy: { id: string, role: string, email: string };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}