package lib

import (
	hs "github.com/neper-stars/houston"
)

type OrderValidator struct {
	order *hs.Order
}

func NewOrderValidator(fName string) (*OrderValidator, error) {
	var v OrderValidator
	o, err := hs.NewOrderFromFile(fName)
	if err != nil {
		return nil, err
	}
	v.order = o

	return &v, nil
}

func (o *OrderValidator) TurnIsSubmitted() bool {
	return o.order.TurnSubmitted()
}

func (o *OrderValidator) Year() int {
	return o.order.Year()
}
