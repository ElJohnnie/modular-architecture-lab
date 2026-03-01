import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

export abstract class DefaultTypeOrmRepository<T extends ObjectLiteral> {
  private repository: Repository<T>;
  constructor(
    readonly entity: EntityTarget<T>,
    readonly dataSource: DataSource,
  ) {
    /**
     * Note that we don't extend the Repository class from TypeORM, but we use it as a property.
     * This way we can control the access to the repository methods and avoid exposing them to the outside world.
     */
    this.repository = dataSource.getRepository(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  /**
   * These are test only methods that should not be used in real enviroments.
   */
  async deleteAll(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('This method can only be used in test environment');
    }
    const entities = await this.repository.find();
    await this.repository.remove(entities);
  }
}
