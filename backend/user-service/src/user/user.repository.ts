import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByKeycloakId(keycloakId: string) {
    return this.repo.findOne({ where: { keycloak_id: keycloakId } });
  }

  findAll() {
    return this.repo.find();
  }

  findAthletes(fitnessLevel?: string, primaryGoal?: string, city?: string, excludeId?: string) {
    const qb = this.repo.createQueryBuilder('u')
      .where('u.role = :role', { role: 'Athlete' });
    if (excludeId) qb.andWhere('u.id != :excludeId', { excludeId });
    if (fitnessLevel) qb.andWhere('u.fitness_level = :fitnessLevel', { fitnessLevel });
    if (primaryGoal) qb.andWhere('u.primary_goal = :primaryGoal', { primaryGoal });
    if (city) qb.andWhere('u.city ILIKE :city', { city: `%${city}%` });
    return qb.getMany();
  }

  findTrainers() {
    return this.repo.find({ where: { role: 'Trainer' } });
  }

  save(user: Partial<User>) {
    return this.repo.save(user);
  }

  async delete(id: string) {
    await this.repo.delete(id);
  }
}
