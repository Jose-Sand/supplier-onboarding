import { SupplierStatus } from '../value-objects/SupplierStatus';
import { Email } from '../value-objects/Email';
import { Phone } from '../value-objects/Phone';
import { DomainEvent } from '../events/DomainEvent';
import { SupplierRegistered } from '../events/SupplierRegistered';
import { SupplierApproved } from '../events/SupplierApproved';
import { SupplierRejected } from '../events/SupplierRejected';

export interface SupplierProps {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Supplier {
  private readonly _id: string;
  private _companyName: string;
  private _email: Email;
  private _phone: Phone;
  private _country: string;
  private _status: SupplierStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  private constructor(props: SupplierProps) {
    this._id = props.id;
    this._companyName = props.companyName;
    this._email = Email.create(props.email);
    this._phone = Phone.create(props.phone);
    this._country = props.country;
    this._status = SupplierStatus.fromString(props.status);
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(
    id: string,
    companyName: string,
    email: string,
    phone: string,
    country: string,
  ): Supplier {
    if (!companyName || companyName.trim().length === 0) {
      throw new Error('Supplier companyName cannot be empty');
    }
    if (!country || country.trim().length === 0) {
      throw new Error('Supplier country cannot be empty');
    }

    const supplier = new Supplier({
      id,
      companyName: companyName.trim(),
      email,
      phone,
      country: country.trim().toUpperCase(),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    supplier._domainEvents.push(
      new SupplierRegistered(id, supplier._companyName, supplier._email.toString(), supplier._country),
    );

    return supplier;
  }

  static reconstitute(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  approve(): void {
    if (!this._status.isPending()) {
      throw new Error(
        `Cannot approve supplier with status ${this._status.toString()}. Only PENDING suppliers can be approved`,
      );
    }
    this._status = SupplierStatus.approved();
    this._updatedAt = new Date();
    this._domainEvents.push(new SupplierApproved(this._id, this._companyName));
  }

  reject(reason?: string): void {
    if (this._status.isRejected()) {
      throw new Error('Supplier is already rejected');
    }
    if (this._status.isApproved()) {
      throw new Error('Cannot reject an already approved supplier. Use suspend() instead');
    }
    this._status = SupplierStatus.rejected();
    this._updatedAt = new Date();
    this._domainEvents.push(new SupplierRejected(this._id, this._companyName, reason));
  }

  suspend(): void {
    if (!this._status.isApproved()) {
      throw new Error(
        `Cannot suspend supplier with status ${this._status.toString()}. Only APPROVED suppliers can be suspended`,
      );
    }
    this._status = SupplierStatus.suspended();
    this._updatedAt = new Date();
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  get id(): string            { return this._id; }
  get companyName(): string   { return this._companyName; }
  get email(): Email          { return this._email; }
  get phone(): Phone          { return this._phone; }
  get country(): string       { return this._country; }
  get status(): SupplierStatus { return this._status; }
  get createdAt(): Date       { return this._createdAt; }
  get updatedAt(): Date       { return this._updatedAt; }

  toSnapshot(): SupplierProps {
    return {
      id: this._id,
      companyName: this._companyName,
      email: this._email.toString(),
      phone: this._phone.toString(),
      country: this._country,
      status: this._status.toString(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
