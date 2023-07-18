class EventAddressDto {
    constructor(name, street, number, postal_code, neighborhood, city, state, acronymState) {
        this.name = name;
        this.street = street;
        this.number = number;
        this.postal_code = postal_code;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.acronymState = acronymState;
    }
  }
  
  module.exports = EventAddressDto;
  