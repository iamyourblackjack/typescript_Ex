interface Contact {
  id: number;
}

const currentUser = {
  id: 1234,
  roles: ["ContactEditor"],
  isAuthenticated(): boolean {
    return true;
  },
  isInRole(role: string): boolean {
    return this.roles.contains(role);
  },
};

// Decorator factory
function authorize(role: string) {
  return function authorizeDecorator(
    target: any,
    property: string,
    descriptor: PropertyDescriptor
  ) {
    const wrapped = descriptor.value;
    descriptor.value = function () {
      if (!currentUser.isAuthenticated()) {
        throw Error("User is not authenticated");
      }
      if (!currentUser.isInRole(role)) {
        throw Error(`User not in role ${role}`);
      }
      try {
        return wrapped(this, arguments);
      } catch (ex) {
        console.log(ex);
        throw ex;
      }
    };
  };
}

// Class Decorator
function freeze(constructor: Function) {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
}

function singleton<T extends { new (...args: any[]): {} }>(ctor: T) {
  return class Singleton extends ctor {
    static _instance: Singleton = null;

    constructor(...args: any[]) {
      super(...args);
      if (Singleton._instance) {
        throw Error("Duplicate instane");
      }
      Singleton._instance = this;
    }
  };
}
@freeze
@singleton
class ContactRepository {
  private contacts: Contact[] = [];

  @authorize("ContactViewer")
  getContactById(id: number): Contact | null {
    const contact = this.contacts.find((x) => x.id === id);
    return contact;
  }

  @authorize("ContactEditor")
  save(contact: Contact): void {
    const existing = this.getContactById(contact.id);

    if (existing) {
      Object.assign(existing, contact);
    } else {
      this.contacts.push(contact);
    }
  }
}
