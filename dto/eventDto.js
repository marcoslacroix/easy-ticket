class EventDTO {
    constructor(id, name, period, companyId, start, description, createdOn, image) {
      this.id = id;
      this.name = name;
      this.period = period;
      this.companyId = companyId;
      this.start = start;
      this.description = description;
      this.createdOn = createdOn;
      this.image = image;
    }
  }
  
  module.exports = EventDTO;
  