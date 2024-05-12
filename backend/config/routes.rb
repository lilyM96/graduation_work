Rails.application.routes.draw do
  # get 'maps/index'
  root to: 'maps#index'
  # resources :maps, only: [:index]
  get '/terms', to: 'footers#terms'
  get '/privacy_policy', to: 'footers#privacy_policy'
end
