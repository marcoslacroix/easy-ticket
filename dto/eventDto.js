class EventDTO {
    constructor(id, name, period, companyId, start, description, image, eventAddress, lots) {
      this.id = id;
      this.name = name;
      this.period = period;
      this.companyId = companyId;
      this.start = start;
      this.description = description;
      this.image = image;
      this.eventAddress = eventAddress;
      this.lots = lots;
    }
  }


  module.exports = EventDTO;
  