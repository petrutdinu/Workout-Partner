import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(private repo: UserRepository) {}

  async getOrCreate(data: {
    keycloak_id: string; email?: string; username: string;
    first_name?: string; last_name?: string; role: string;
  }): Promise<User> {
    let user = await this.repo.findByKeycloakId(data.keycloak_id);
    const email = data.email || `${data.username}@workoutpartner.local`;

    if (user) {
      Object.assign(user, { email, username: data.username, first_name: data.first_name, last_name: data.last_name, role: data.role });
      return this.repo.save(user);
    }
    return this.repo.save({ ...data, email });
  }

  async updateFitnessProfile(id: string, data: Partial<User>): Promise<User | null> {
    const user = await this.repo.findById(id);
    if (!user) return null;
    Object.assign(user, data);
    if (user.fitness_level && user.primary_goal && user.preferred_days?.length) {
      user.profile_complete = true;
    }
    return this.repo.save(user);
  }

  findById(id: string) { return this.repo.findById(id); }
  findByKeycloakId(id: string) { return this.repo.findByKeycloakId(id); }
  findAll() { return this.repo.findAll(); }
  findAthletes(fitnessLevel?: string, primaryGoal?: string, city?: string) {
    return this.repo.findAthletes(fitnessLevel, primaryGoal, city);
  }
  findTrainers() { return this.repo.findTrainers(); }
  async delete(id: string): Promise<boolean> {
    const user = await this.repo.findById(id);
    if (!user) return false;
    await this.repo.delete(id);
    return true;
  }
}
